const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './app.js', // Entry point
  output: {
    filename: 'bundle.js', // Output bundle
    path: path.resolve(__dirname, 'dist'), // Output directory
    clean: true, // Clean the output directory before emit
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader', // Transpile ES6+
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'], // Handle CSS imports
      },
      {
        test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
        type: 'asset/resource', // Handle images and fonts
      },
      {
        test: /\.md$/,
        use: 'raw-loader', // Load markdown files as strings
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html', // Use our HTML file as a template
    }),
  ],
  devServer: {
    static: '.', // Serve files from the dist directory
    open: true, // Open the browser after server had been started
  },
  externals: {
    babylonjs: 'BABYLON',
    'babylonjs-gui': 'BABYLON.GUI',
  },
};
