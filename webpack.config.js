const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                    },
                },
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(jpg|gif)$/,
                type: 'asset/resource',
                generator: {
                    filename: '[name][ext]', // Save images in the 'images/' folder in dist
                },
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Universal Theory of Kinetic Harmonics',
            meta: { viewport: 'width=device-width, initial-scale=1' },
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'src/README.md', to: 'README.md' }, // Copy README.md
                { from: 'src/ohnollms.png', to: 'src/ohnollms.png' }, // Copy background image
                { from: 'src/imposter-syndrome.png', to: 'src/imposter-syndrome.png' }, // Copy background image
                { from: 'src/Figure_1.png', to: 'src/Figure_1.png' }, // Copy figure 1
                { from: 'src/Figure_2.png', to: 'src/Figure_2.png' }, // Copy figure 2
                { from: 'src/Figure_3.png', to: 'src/Figure_3.png' }, // Copy figure 3
                { from: 'src/Figure_4.png', to: 'src/Figure_4.png' }, // Copy figure 4
            ],
        }),
    ],
    mode: 'production',
};
