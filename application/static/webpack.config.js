const path = require('path');
const webpack = require('webpack');


let dir_path = path.resolve('application/static')
module.exports = {
    entry: [dir_path + '/js/sst_javascript.js',
        dir_path + '/js/index.js'],
    output: {
        filename: 'bundle.js',
        path: dir_path + '/dist',
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
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(js|jsx)$/,
                exclude: /(node_modules|bower_components)/,
                use: [{
                    // babel-loader to convert ES6 code to ES5 + amdCleaning requirejs code into simple JS code, taking care of modules to load as desired
                    loader: 'babel-loader',
                    options: {
                        presets: [],
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