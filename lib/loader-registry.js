'use strict';

/**
 * @name LoaderRegistry
 *
 * @description
 *  Simple utility class for managing loaders
 */
function LoaderRegistry() {
  this.loaders = [];
}

/**
 * @name getLoaderByPath
 *
 * @description
 *  Returns the registered loader for the given loader path or undefined
 *  if no loader has been registered.
 *
 * @param path - The path to look up
 *
 * @return the loader definition if exists or undefined
 *
 */
LoaderRegistry.prototype.getLoaderByPath = function (path) {
  return this.loaders.filter(function (loader) {
    return loader.path === path;
  })[0];
};

/**
 * @name getLoaderByName
 *
 * @description
 *  Returns the registered loader for the given loader namr or undefined
 *  if no loader has been registered.
 *
 * @param name - The name to look up
 *
 * @return the loader definition if exists or undefined
 *
 */
LoaderRegistry.prototype.getLoaderByName = function (name) {
  return this.loaders.filter(function (loader) {
    return loader.name === name;
  })[0];
};


/**
 * @name registerLoader
 *
 * @description
 *  Registers a new loader in the registry
 *
 * @param loader - The loader to register
 *
 * @return the newly registered loader
 *
 */
LoaderRegistry.prototype.registerLoader = function (loader) {
  this.loaders.push(loader);
  return loader;
};

/**
 * @name allLoaders
 *
 * @description
 *  Returns all loaders currently registered
 *
 * @return all loaders currently registered
 *
 */
LoaderRegistry.prototype.allLoaders = function () {
  return this.loaders;
};

/**
 * @name filterLoaders
 *
 * @description
 *  Returns a list of loaders of this registry filtered through the
 *  given filterFnc.
 *
 * @param filterFnc - The function to apply for each loader in this
 *   registry. Should return truesy if the current loader matches the
 *   filter, falsy if otherwise.
 *
 * @return all loaders that match the given filter-function
 *
 */
LoaderRegistry.prototype.filterLoaders = function (filterFnc) {
  return this.allLoaders().filter(filterFnc);
};

module.exports = LoaderRegistry;
