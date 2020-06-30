const path = require('path');
const webpack = require('webpack');

let dir_path = path.resolve('ssfl/static')
module.exports = {
    entry: [
        dir_path + '/js/index.js',
        dir_path + '/js/sst_javascript.js',
        dir_path + '/sass/sst_styles.scss',
        dir_path + '/sass/mystyles.scss',
        dir_path + '/css/nav_mystyles.css',
        dir_path + '/css/calendar.css',
    ],
    output: {
        filename: 'packed.js',
        path: dir_path + '/gen',
        publicPath: "/static/",
        chunkFilename: "[id]-[chunkhash].js"
    },
    devServer: {
        writeToDisk: true,
    },
    resolve: {
        extensions: ['.js', '.jsx', '.css'],
        modules: ['node_modules']
    },
    mode: 'development',
    devtool: "source-map",
    module: {
        rules: [
            {
                test: /\.(scss|sass|css)$/i,
                use: ['style-loader', 'css-loader', 'sass-loader'],
            },
            {
                test: /\.(js|jsx)$/,
                exclude: /(node_modules|bower_components)/,
                use: [{
                    // babel-loader to convert ES6 code to ES5 + amdCleaning requirejs code into simple JS code, taking care of modules to load as desired
                    loader: 'babel-loader',
                    options: {
                        presets: ['babel-preset-env'],
                        plugins: []
                    },
                },
                    {
                        loader: 'shebang-loader'
                    },
                ],
            },
        ],
    },
}
;
