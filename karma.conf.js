module.exports = function (config) {
    config.set({
        basePath: './',
        frameworks: ['mocha', 'chai'],
        files: [
            'test.webpack.js',
        ],
        webpack: {
            module: {
                rules: [
                    {
                        test: /\.js$/,
                        use: {
                            loader: 'babel-loader',
                            query: {
                                presets: ['es2015'],
                            },
                        },
                        exclude: /node_modules/,
                    },
                    {
                        test: /\.js$|\.jsx$/,
                        use: {
                            loader: 'istanbul-instrumenter-loader',
                            options: { esModules: true },
                        },
                        enforce: 'pre',
                        exclude: /node_modules|src\/renderer\/|\.spec\.js$/,
                    },
                ],
            },
        },
        preprocessors: {
            'test.webpack.js': ['webpack'],
        },
        exclude: [
            '**/*.swp',
        ],

        coverageIstanbulReporter: {
            dir: 'coverage/',
            thresholds: {
                // set to `true` to not fail the test command when thresholds are not met
                emitWarning: false,
                // thresholds for all files
                global: {
                    statements: 80,
                    lines: 80,
                    branches: 80,
                    functions: 80,
                },
                // thresholds per file
                each: {
                    statements: 80,
                    lines: 80,
                    branches: 80,
                    functions: 80,
                    overrides: {
                        'baz/component/**/*.js': {
                            statements: 80,
                        },
                    },
                },
            },
            reports: ['html', 'lcov', 'text-summary'],
            fixWebpackSourcePaths: true,
            reporters: [
        { type: 'text' },
        { type: 'html', subdir: 'report-html', file: 'report.html' },
        { type: 'lcov', subdir: 'report-lcov', file: 'report.txt' },
            ],
        },

        reporters: ['progress', 'coverage-istanbul'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: false,
        browsers: ['ChromeHeadlessNoSandbox'],
        customLaunchers: {
            ChromeHeadlessNoSandbox: {
                base: 'ChromeHeadless',
                flags: ['--no-sandbox']
            }
        },
        singleRun: true,
        concurrency: Infinity,
    });
};
