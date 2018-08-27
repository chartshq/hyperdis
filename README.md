[![NPM version](https://img.shields.io/npm/v/hyperdis.svg)](https://www.npmjs.com/package/hyperdis)
[![NPM total downloads](https://img.shields.io/npm/dt/hyperdis.svg)](https://www.npmjs.com/package/hyperdis)
[![Contributors](https://img.shields.io/github/contributors/chartshq/hyperdis.svg)](https://github.com/chartshq/hyperdis/graphs/contributors)
[![License](https://img.shields.io/github/license/chartshq/hyperdis.svg)](https://github.com/chartshq/hyperdis/blob/master/LICENSE)

## What is Hyperdis?

A high performance reactive state store for web apps. Hyperdis takes an plain old JavaScript object and provides an
interface to observe or change the object through the interface.

## Features

* 👀 Makes any object observable.
* 👂 Listeners for property which gets fired in the current animation frame or in the next animation frame.
* ⚡️ Calculated property, which gets called only when the dependent property gets changed.
* 🚿 Commit mass mutation by acquiring locking.

## Installation

Install hyperdis from NPM:

```bash
$ npm install --save hyperdis
```

And import it as follows:

```javascript
import State from 'hyperdis';
```

## API

### Static Methods

#### `create()`

Takes a simple JavaScript Object and make it observable. This returns the new object as a state instance.

```javascript
let state = State.create({ 
    range: {
        start: 1,
        end: 5 
    },
    visible: true 
   });
```

### Instance Methods

#### `serialize`

Since `State.create` does not return the JavaScript object back as it deserialize the JavaScript object to native data-structure, `serialize` function comes to the rescue to get the JavaScript object back.

```javascript
    state.serialize();
    // Output:
    //  {
    //     range: {
    //         start: 1,
    //         end: 5 
    //     },
    //     visible: true
    //  }
```

#### `append`

Appends property in the existing state (mutates the original state). The is called using two parameters. The first parameter is where to append the state and the second being what property to append.

```javascript
myState.append('range.type', { absolute: true });
```

When serialized using `myState.serialize()` the following output is shown:

```javascript
// Output
//  {
//     range: {
//         start: 1,
//         end: 5, 
//         type: {
//             absolute: true 
//         }
//     },
//     visible: true 
//  }
```

The same function can be called with only one parameter, just by passing the new state properties. In this case it appends the property in the base.

```javascript
myState.create({ focus: null });
```

If `myState.serialize()` is called the following output is shown:

```javascript
myState.serialize();
// Output
//  {
//     range: {
//         start: 1,
//         end: 5, 
//         type: {
//             absolute: true 
//         }
//     },
//     visible: true, 
//     focus: null
//  }
```

This function returns the same state on which the method was called.

#### `prop`

This acts as getter and setter. If the function is called by passing only one argument, it retrieve the value associated with the property.

```javascript
myState.prop('range.type');
// Output
//  {
//     absolute: true
//  }
```

If the same function is called using two parameters, first one being the property and second one being the value, then the value is set for the property and the handlers are called (if any) which got registered using the `on` function.

```javascript
myState.prop('visible', true);
```

This returns the instance on which it was called for chaining.

#### `on`

This function takes a single or group of property and handler which is called when any of the properties are changed.
When a single property is changed the handler is called with two parameter, what was the old value of the state property and what is the new value.

```javascript
myState.on('range.start', (oldValue, newValue) => {
    console.log('Value before prop change', oldValue);
    console.log('Value after prop change', newValue);
});

myState.prop('range.start', 9);
// Output:
// Value before prop change 1 Value after prop change 9
```

If a handler is registered on change of a property which has another state property as value, then the handler gets called whenever any state property connected to it gets changed.

```javascript
myState.on('range', (oldValue, newValue) => {
    console.log('Value before prop change', oldValue);
    console.log('Value after prop change', newValue);
});

myState.prop('range.start', 10);
myState.prop('range.type.absolute', false);
// Output:
// Value before prop change range {
//     start: 9,
//     end: 5,
//     type: {
//         absolute: true
//     }
// }
// Value after prop change range: {
//     start: 10,
//     end: 5,
//     type: {
//         absolute: false
//     }
// }
```

If a handler is registered with more than one property change then, the handler is called when any of the properties gets changed. In this cast the handler is called with more than one parameter : each for one state property which is registered for listening.Each parameter is of type array containing `[oldValue, newValue]`.

```javascript
myState.on('range.start', 'range.end', (start, end) => {
    console.log('Start', start);
    console.log('End', end);
});

myState.prop('range.start', 12);
// Output:
// Start [10, 12]
// End [5, 5]
myState.prop('range.end', 7);
// Output:
// Start [12, 12]
// End [5, 7]
```

The `on` returns a function which if called the listener registered gets unregistered.

```javascript
let unsub = myState.on('range.start', 'range.end', (start, end) => {
    console.log('Start', start);
    console.log('End', end);
});

// Call to unsubscribe
unsub();
```

`On` takes an optional boolean value as the last parameter, which if passed as a true value the handler gets called during registration itself.

#### `next`

Just like the way on works, it just calls the handlers at the start of next event loop.

#### `lock` and `unlock`

This helps control the call of handler when a property is changed.

```javascript
myState.on('range.start', 'range.end', (start, end) => {
    console.log('Start', start);
    console.log('End', end);
});

myState.prop('range.start', 12);
// Output:
// Start [10, 12]
// End [5, 5]
myState.prop('range.end', 7);
// Output:
// Start [12, 12]
// End [5, 7]
```

Here the handler is called twice, because two times the property was changed. This is not always desirable. For updating group of same property the user might want to the handler to get executed only once.
This time locking and unlocking comes in picture.

```javascript
myState.on('range.start', 'range.end', (start, end) => {
    console.log('Start', start);
    console.log('End', end);
});

myState.lock().prop('range.start', 12).prop('range.end', 7).unlock()
// Output:
// Start [10, 12] End [5, 7]
```

Once `lock()` is called the state caches all the change that comes after this. When `unlock()` is called it applies all the changes to the state and the handler is called.

## Contributing

Your PRs and stars are always welcome :). Checkout the [Contributing](https://github.com/chartshq/hyperdis/CONTRIBUTING.md) guides.

## License

MIT