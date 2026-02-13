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
                    filename: '[name][ext]',
                },
            },
            {
                test: /\.md$/,
                type: 'asset/source',
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Universal Theory of Kinetic Harmonics',
            meta: {
                viewport: 'width=device-width, initial-scale=1',
                description: 'The Universal Theory of Kinetic Harmonics (UTKH) proposes that all phenomena arise from light in co-orbital resonance patterns, unifying gravity, mass, and quantum behavior under harmonic principles.',
                'og:title': { property: 'og:title', content: 'Universal Theory of Kinetic Harmonics' },
                'og:description': { property: 'og:description', content: 'A unified field theory proposing that all phenomena arise from light in co-orbital resonance patterns.' },
                'og:type': { property: 'og:type', content: 'article' },
            },
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'src/README.md', to: 'README.md' },
                { from: 'src/ohnollms.png', to: 'src/ohnollms.png' },
                { from: 'src/imposter-syndrome.png', to: 'src/imposter-syndrome.png' },
                { from: 'src/techno-phobia.png', to: 'src/techno-phobia.png' },
                { from: 'src/Figure_1.png', to: 'src/Figure_1.png' },
                { from: 'src/Figure_2.png', to: 'src/Figure_2.png' },
                { from: 'src/Figure_3.png', to: 'src/Figure_3.png' },
                { from: 'src/Figure_4.png', to: 'src/Figure_4.png' },
            ],
        }),
    ],
    mode: 'production',
};
