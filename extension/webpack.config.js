const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = {
    mode: "production",
    node: {
        fs: "empty"
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: {
                    loader: "babel-loader"
                }
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader',
                ],
            },
            {
                test: /\.vue$/,
                use: [
                    'vue-loader'
                ],
            },
        ]
    },
    entry: {
        popup: './src/popup.js',
        background: './src/js/background/index.js',
        inject: './src/js/inject/index.js'
    },
    plugins: [
        new CopyWebpackPlugin([
            { from: 'src' }
        ]),
        new VueLoaderPlugin()
    ],
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, 'build')
    },
}
