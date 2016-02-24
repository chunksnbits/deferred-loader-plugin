'use strict';

var q = require('bluebird');

/**
 * @name LoaderResolver
 *
 * @description
 *  Simple utilty class that provides helper methods for resolving
 *  loader imports and loader-short-names.
 */
function LoaderResolver() {
  this.loaders = {};
}

/**
 * @name registerLoaders
 *
 * @description
 *  Registers the loaders provided.
 *
 * @param loaders - An array of loaders (full path or short)
 * @param context - The current application context (a path)
 * @param resolver - A webpack Resolver object
 *
 * @return a map of loaders, with the full path as key and the loader name as value (as a promise)
 *
 */
LoaderResolver.prototype.declareLoaders = function (loaders, context, resolver) {

  var self = this;

  var promises = loaders.map(function (name) {
    return self.resolveLoader(name, context, resolver);
  });

  return q.all(promises)
    .then(function (loaders) {
      loaders.forEach(function (loader) {
        self.loaders[loader.path] = loader;
      });
      return self.loaders;
    });
};

/**
 * @name resolveName
 *
 * @description
 *  Resolves a loader path to it's short-name.
 *
 * @param path - The full path to resolve
 *
 * @return the short name of the loader for the given path
 *
 */
LoaderResolver.prototype.resolveName = function (path) {
  return this.loaders[path].name;
};

/**
 * @name resolvePath
 *
 * @description
 *  Resolves the absolute path for a given loader's (short) name.
 *
 * @param name - The loader's (short) name to resolve the path for.
 *
 * @return the absolute path to the loader if registered.
 *
 */
LoaderResolver.prototype.resolvePath = function (name) {
  return Object.keys(this.loaders).filter(function (loader) {
    return loader.name === name;
  })[0];
};

/**
 * @name loadLoader
 *
 * @description
 *  Loads from the specified loader from the given full path.
 *
 * @param path - The full path of the loader (can include query parameters)
 *
 * @return the requested loader
 */
LoaderResolver.prototype.loadLoader = function (path) {
  // Remove any query parameters if provided.
  return require(this.normalizePath(path));
};

/**
 * @name normalizePath
 *
 * @description
 *  Trims the given path from it's query parameters.
 *
 * @param path - The full path to normalize
 *
 * @return the normalized path
 *
 */
LoaderResolver.prototype.normalizePath = function (path) {
  return path.replace(/\?.*/, '');
};

/**
 * @name resolveLoader
 *
 * @description
 *  Resolves the given loader alias / short-name
 *
 * @param loader - The name of the loader to resolve
 * @param context - The current application context (a path)
 * @param resolver - A webpack Resolver object
 *
 * @return an object specification of the loader, indicating the path and name of the loader (as a promise)
 *
 */
LoaderResolver.prototype.resolveLoader = function (name, context, resolver) {
  var loader = this.resolveLoaderFromCache(name);

  if (!!loader) {
    return q.resolve(loader);
  }

  var deferred = q.defer();

  resolver.resolve(context, name, function (error, path) {
    if (error) {
      deferred.reject(error);
    }

    deferred.resolve({
      name: name,
      path: path
    });
  });

  return deferred.promise;
};

/**
 * @name resolveLoaderFromCache
 *
 * @description
 *  Resolves the given loader alias / short-name from cache (if exists)
 *
 * @param name - The (short) name of the loader to resolve
 *
 * @return an object specification of the loader, indicating the path and name of the loader (as a promise)
 *
 */
LoaderResolver.prototype.resolveLoaderFromCache = function (name) {
  var self = this;

  return Object.keys(this.loaders).filter(function (path) {
    return self.loaders[path] === name;
  })[0];
};

module.exports = LoaderResolver;
