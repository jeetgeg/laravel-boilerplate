require('dotenv').config()
const path = require('path')
const webpack = require('webpack')

const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const WebpackNotifierPlugin = require('webpack-notifier')
const ManifestPlugin = require('webpack-manifest-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

const hmr = process.argv.includes('--hot')
const production = process.env.NODE_ENV === 'production'
const devServerPort = parseInt(process.env.DEV_SERVER_PORT || '8080', 10)

const publicPathFolder = production ? '/dist/' : '/build/'
const publicPath = hmr ? `http://localhost:${devServerPort}${publicPathFolder}` : publicPathFolder

function getEntryConfig (name, analyzerPort) {
  let plugins = [
    new webpack.IgnorePlugin(/jsdom$/),
    new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /fr/),
    new WebpackNotifierPlugin({
      alwaysNotify: true
    }),
    new MiniCssExtractPlugin({
      filename: production ? 'css/[name].[chunkhash].css' : 'css/[name].css'
    }),
    new ManifestPlugin({
      fileName: `manifest-${name}.json`,
      publicPath,
      writeToFileEmit: true
    })
  ]

  if (production) {
    plugins.push(...[
      new BundleAnalyzerPlugin({
        analyzerPort
      })
    ])
  }

  return {
    entry: {
      [name]: [
        `./resources/assets/js/${name}/app.js`,
        `./resources/assets/sass/${name}/app.scss`
      ]
    },
    output: {
      path: path.resolve(__dirname, 'public' + publicPathFolder),
      filename: production ? 'js/[name].[chunkhash].js' : 'js/[name].js',
      publicPath
    },
    module: {
      rules: [
        {
          test: /\.scss$/,
          use: [
            hmr ? 'style-loader' : MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                minimize: production,
                sourceMap: true
              }
            }, {
              loader: 'postcss-loader',
              options: {
                ident: 'postcss',
                sourceMap: true
              }
            }, {
              loader: 'resolve-url-loader'
            }, {
              loader: 'sass-loader',
              options: {
                outputStyle: 'expanded',
                sourceMap: true
              }
            }
          ]
        },
        {
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          enforce: 'pre'
        },
        {
          test: /\.vue$/,
          loader: 'vue-loader'
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel-loader'
        },
        {
          test: /\.(png|jpe?g|gif)$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: (path) => {
                  if (!/node_modules/.test(path)) {
                    return 'images/[name].[ext]?[hash]'
                  }

                  return `images/vendor-${name}/` + path
                    .replace(/\\/g, '/')
                    .replace(
                      /((.*(node_modules))|images|image|img|assets)\//g, ''
                    ) + '?[hash]'
                }
              }
            },
            {
              loader: 'img-loader',
              options: {
                enabled: production
              }
            }
          ]
        },
        {
          test: /\.(woff2?|ttf|eot|svg|otf)$/,
          loader: 'file-loader',
          options: {
            name: (path) => {
              if (!/node_modules/.test(path)) {
                return 'fonts/[name].[ext]?[hash]'
              }

              return `fonts/vendor-${name}/[name].[ext]?[hash]`
            }
          }
        }
      ]
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          vendor: {
            test: /node_modules/,
            name: `vendor-${name}`,
            chunks: 'all'
          }
        }
      }
    },
    plugins,
    resolve: {
      extensions: ['.js', '.vue', '.json'],
      alias: {
        'vue$': 'vue/dist/vue.esm.js',
        '@fortawesome/fontawesome-free-solid$': '@fortawesome/fontawesome-free-solid/shakable.es.js',
        '@fortawesome/fontawesome-free-brands$': '@fortawesome/fontawesome-free-brands/shakable.es.js'
      }
    },
    externals: {
      jquery: 'jQuery',
      'popper.js': 'Popper'
    },
    devtool: production ? 'source-map' : 'cheap-module-eval-source-map',
    devServer: {
      contentBase: path.resolve(__dirname, 'public'),
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      historyApiFallback: true,
      compress: true,
      noInfo: true,
      quiet: true,
      port: devServerPort
    }
  }
}

module.exports = [
  getEntryConfig('frontend', 8888),
  getEntryConfig('backend', 8889)
]
