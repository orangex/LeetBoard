const path = require('path');
// const HtmlWebpackPlugin = require('html-webpack-plugin');
// const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const autoprefixer = require('autoprefixer');
module.exports = {
    mode: "development",
    entry: ["./src/index.ts","./src/index.scss"],

    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: 'inline-source-map',
    devServer: {
        contentBase: './dist'
    },
    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [" ",".ts", ".tsx", ".js"],
        modules:[path.resolve(__dirname, '/src'),'node_modules/']
    },
    plugins: [
        // new CleanWebpackPlugin(),
        // new HtmlWebpackPlugin()
    ],
    module: {
        // loaders: [
        //     // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
        //     { test: /\.tsx?$/, loader: "awesome-typescript-loader" }
        // ],
        rules: [
            {
                test: /\.s[ac]ss$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: 'bundle.css',
                        },
                    },
                    { loader: 'extract-loader' },
                    { loader: 'css-loader' },
                    {
                        loader: 'postcss-loader',
                        options: {
                           plugins: () => [autoprefixer()]
                        }
                      },
                    {
                        loader: 'sass-loader',
                        options: {
                            sassOptions: {
                                // indentWidth: 4,
                                includePaths: ['./node_modules'],
                            },
                        },
                        // options: {
                        //   includePaths: ['./node_modules']
                        // }
                    }
                ]
            },

            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ]
    },
};