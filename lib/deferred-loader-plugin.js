/* jshint node:true */
'use strict';

var q = require('bluebird');

var LoaderRegistry = require('./loader-registry');
var LoaderResolver = require('./loader-resolver');

var loaderRegistry = new LoaderRegistry();
var loaderResolver = new LoaderResolver();

function DeferredLoaderPlugin(options) {
  this.options = options || {};
}

/**
 * @name apply
 *
 * @description
 *  The function to call during webpack's apply phase. Will
 *  register all DeferredLoaderPlugin compabible loaders.
 *
 * @param compilater - the webpack compiler
 *
 */
DeferredLoaderPlugin.prototype.apply = function apply(compiler) {
  var self = this;

  compiler.plugin('normal-module-factory', function (moduleFactory) {
    moduleFactory.plugin('before-resolve', function (data, done) {

      //
      // After the resolve phase webpack will reference each loader by their full
      // path.
      // Initialize a mapping of loader short-name to full path for more
      // convenient mapping of DeferredLoaderPlugin-options,
      // i.e., allow providing options by a loader's short-name.
      //
      var loaders = [self.options.loader];

      loaderResolver.declareLoaders(loaders, data.context, this.resolvers.loader)
        .then(function () {
          done(null, data);
        })
        .catch(function (error) {
          done(error);
        });
    });

    moduleFactory.plugin('after-resolve', function (data, done) {
      //
      // Register all loaders that define a 'deferredEmit' function
      // and initialize the optional options-call if provided.
      //
      data.loaders.forEach(function (path) {
        if (loaderRegistry.getLoaderByPath(path)) {
          return;
        }

        // Extract loader definition,
        // In case of multiple deferred loaders, a falsy result
        // indicates that another deferred loader plugin instance carries the
        // configuration for that deferred loader.
        var loader = self.tryAndParseLoader(path);

        if (!!loader) {
          loaderRegistry.registerLoader(loader);

          //
          // Allows to access the options provided to the DeferredLoaderPlugin
          // in the loader- as well as the emit-phase.
          //
          if (loader.isDeferredLoader && typeof loader.fnc.options === 'function') {
            loader.fnc.options(loader.options);
          }
        }
      });

      done(null, data);
    });
  });

  compiler.plugin('emit', function (compilation, done) {
    self.emit(compilation)
      .then(function () {
        done();
      })
      .catch(function (error) {
        done(error);
      });
  });
};

/**
 * @name emit
 *
 * @description
 *  The function to call during webpack's emit phase. Will
 *  apply all registered loaders.
 *
 * @param compilation - webpack compilation unit
 *
 */
DeferredLoaderPlugin.prototype.emit = function (compilation) {
  var loader = loaderRegistry.getLoaderByName(this.options.loader);
  var deferred = q.defer();

  loader.fnc.emitDeferred(compilation, loader.options, function (error) {
    if (error) {
      deferred.reject(error);
    }
    deferred.resolve();
  });

  return deferred.promise;
};

/**
 * @name tryAndParseLoader
 *
 * @description
 *  Resolves loader for the given and evaluates the loader in terms
 *  of compability with DeferredLoaderPlugin.
 *
 * @param path - The absolute path to the loader
 *
 * @return the definition for the loader, holding this information:
 *
 *   isDeferredLoader: boolean       // indicating compability,
 *   fnc*: Loader                    // fhe resolved loader function
 *   path: path                      // the absolute path to the loader
 *   name*: loaderName               // the (short-name) of the loader
 *   options*: options               // The options provided to the loader
 *
 *   * only set for deferred loaders
 *
 */
DeferredLoaderPlugin.prototype.tryAndParseLoader = function (path) {
  var loader = loaderResolver.loadLoader(path);

  if (loader.emitDeferred && typeof loader.emitDeferred === 'function') {
    var loaderName = loaderResolver.resolveName(path);

    // There is another deferred loader instance present in the
    // current webpack configuration. Ignore in case
    // this configuration does not match the loader.
    if (this.options.loader !== loaderName) {
      return null;
    }

    return {
      isDeferredLoader: true,
      fnc: loader,
      path: path,
      name: loaderName,
      options: this.options.options
    };
  }
  else {
    // Mark as checked.
    return {
      path: path,
      isDeferredLoader: false
    };
  }
};

module.exports = DeferredLoaderPlugin;
