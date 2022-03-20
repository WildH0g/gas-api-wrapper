// jshint esversion: 9
// jshint laxbreak: true

const { Token, BasicAuth, BearerAuth } = require('./APIAuth');

const APIBuilder = (function () {

  const _baseUrl = new WeakMap();

  /**
   *
   * Private method that send the HTTP/HTTPS request and return the response
   *
   * @param {string} url The full URL of the request
   * @param {string} method Typically GET, PUT, POST or DELETE
   * @param {object} headers Request heqders
   * @param {string} payload Request payload, stringified object
   * @param {string} contentType Content type, by defalt 'application/json'
   * @returns {object} The HTTP response or the error
   */
  const _doRequest = params => {
    const {
      url,
      method = 'GET',
      headers,
      payload,
      contentType = 'application/json',
    } = params;

    const options = {
      contentType,
      method,
    };
    if (headers) options.headers = headers;
    if (payload && !['get', 'delete'].includes(method.toLowerCase()))
      options.payload = payload;
    let response = '';
    try {
      response = UrlFetchApp.fetch(url, options);
      return JSON.parse(response);
    } catch (err) {
      return { err, response };
    }
  };

  /**
   *
   * Wraps the API, gets returned by the module
   *
   */
  const _apiAuth = new WeakMap();
  const _debugFlag = new WeakMap();
  const _apiMethods = new WeakMap();
  class APIWrapper {
    /**
     *
     * Class constructor that sets the global values for the API
     *
     * @param {string} baseUrl The base URL of the class
     * @param {ApiAuth} auth  the authentication class that corresponds to the authentication type of the API
     */
    constructor(baseUrl, auth) {
      _baseUrl.set(this, baseUrl);
      _debugFlag.set(this, false);
      _apiAuth.set(this, auth);
      _apiMethods.set(this, {});
    }

    get baseUrl() {
      return _baseUrl.get(this);
    }

    get auth() {
      return _apiAuth.get(this);
    }

    get debugMode() {
      return _debugFlag.get(this);
    }

    debugModeOn() {
      _debugFlag.set(this, true);
      return this;
    }

    debugModeOff() {
      _debugFlag.set(this, false);
      return this;
    }

    getMethodData(methodName) {
      return _apiMethods.get(this)[methodName];
    }
  }

  const _apiWrapper = new WeakMap();

  const _interpolateString = (str, params) => {
    if (!params) return str;
    Object.entries(params).forEach(([key, value]) => {
      const re = new RegExp(`\{\{${key}\}\}`, 'g');
      str = str.replace(re, value);
    });
    return str;
  };

  const _interpolateObject = (obj, params) => {
    if (!obj) return;
    let str = JSON.stringify(obj);
    Object.entries(params).forEach(([key, value]) => {
      const re = new RegExp(`\{\{${key}\}\}`, 'g');
      str = str.replace(re, value.replace(/"/g, '\\"'));
    });
    const re = /"[^"]+":"?\{\{.*\}\}"?/g;
    str = str.replace(re, '').replace(/,}$/g, '}');
    return str;
  };

  const _removeEmptyPlaceHolders = str => {
    const re = /[^\{\{\}\}\?&]+=\{\{[^\{\{\}\}\?&]+\}\}/g;
    str = str.replace(re, '').replace(/^&/g, '').replace(/&$/g, '');
    return str;
  };

  const _objToQueryString = (obj, params) => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const interpolated = _interpolateString(value, params);
      const queryString = `${acc}${acc ? '&' : ''}${key}=${interpolated}`;
      return _removeEmptyPlaceHolders(queryString);
    }, '');
  };

  const _parsePath = path => {
    if (!path.trim()) return '/';
    if (!/^\//.test(path)) path = '/' + path;
    if (/\/$/.test(path)) path = path.replace(/\/$/, '');
    return path;
  };

  class apiMethod {
    constructor(name, options) {
      this.name = name;
      this.path = options.path ? _parsePath(options.path) : '/';
      this.method = options.method || 'GET';
      this.headers = options.headers || {};
      if (options.payload) this.payload = options.payload;
      this.queryParams = options.queryParams || {};
    }
  }

  class APIBuilder {
    constructor(baseUrl, auth) {
      const { type, token, secret, addTo, username, password } = auth;
      const authTypes = {
        KeyToken: new Token(addTo, token, secret),
        Basic: new BasicAuth(username, password),
        Bearer: new BearerAuth(token),
      };
      if (!authTypes[type]) throw new Error(`No auth of type "${type}" found`);
      _apiWrapper.set(this, new APIWrapper(baseUrl, authTypes[type]));
    }

    /**
     *
     * Adds a method to the API wrapper. Requires method name as well as the path, method, headers, payload and query parameters inthe options
     *
     * @param {*} name Method name
     * @param {*} options Method name comtaining the path, http method, headers, payload and query parameters (in object format)
     * @returns
     */

    addMethod(name, options) {
      const apiWrapper = _apiWrapper.get(this);
      apiWrapper[name] = function (params) {
        const rawMethod = new apiMethod(name, options);
        const processedMethod = { ...rawMethod };
        processedMethod.path = _interpolateString(processedMethod.path, params);
        let url = this.auth.getAuthUrl(this, processedMethod);
        const queryString = _objToQueryString(
          processedMethod.queryParams,
          params
        );
        if (queryString) {
          const linkChar = /\?/.test(url) ? '&' : '?';
          url += linkChar + queryString;
        }
        processedMethod.payload = _interpolateObject(
          processedMethod.payload,
          params
        );
        processedMethod.headers = this.auth.getAuthHeaders(
          processedMethod.headers
        );
        const requestParams = {
          ...processedMethod,
          url,
          queryString,
        };
        return this.debugMode ? requestParams : _doRequest(requestParams);
      };
      return this;
    }

    /**
     * Return the Api Wrapper
     * @returns {APIWrapper}
     */
    build() {
      return _apiWrapper.get(this);
    }
  }

  return APIBuilder;
})();

if ('undefined' !== typeof module) module.exports = APIBuilder;
