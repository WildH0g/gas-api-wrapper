// jshint esversion: 9
// jshint laxbreak: true

const SETTINGS = require('./APISettings');

const Auth = (function () {

  const _addTo = new WeakMap();
  const _token = new WeakMap();
  const _secret = new WeakMap();
  const _username = new WeakMap();
  const _password = new WeakMap();

  /**
   * The interface for all athorization types
   */
  class Auth {
    getAuthUrl(caller, method) {
      return caller.baseUrl + method.path;
    }

    getAuthHeaders(headers = {}) {
      return headers;
    }
  }

  /**
   * Key-Token or Token only authentication type that adds the authentication keys in query string or headers
   */
  class Token extends Auth {
    /**
     * Validates and sets the read-only authentication properties
     *
     * @param {*} options
     */
    constructor(addTo, token, secret) {
      super();
      const addTos = ['headers', 'query'];
      if (!addTos.includes(addTo)) addTo = 'query';
      _addTo.set(this, addTo);
      _token.set(this, token);
      _secret.set(this, secret);
    }
    get addTo() {
      return _addTo.get(this);
    }
    get token() {
      return _token.get(this);
    }
    get secret() {
      return _secret.get(this);
    }

    get name() {
      return 'KeyToken';
    }

    getAuthUrl(caller, method) {
      const path = caller.baseUrl + method.path;
      if ('query' !== this.addTo) return path;
      const tokenString = this.token
        ? `${this.token.name}=${encodeURI(this.token.value)}`
        : '';
      const secretString = this.secret
        ? `${this.secret.name}=${encodeURI(this.secret.value)}`
        : '';
      let authString = '';
      if (tokenString) authString += '?' + tokenString;
      if (secretString)
        authString += authString ? '&' + secretString : '?' + secretString;
      return path + authString;
    }

    getAuthHeaders(headers = {}) {
      if ('headers' !== this.addTo) return headers;
      if (this.token) headers[this.token.name] = this.token.value;
      if (this.secret) headers[this.secret.name] = this.secret.value;
      return headers;
    }
  }

  class BasicAuth extends Auth {
    constructor(username, password) {
      super();
      _username.set(this, username);
      _password.set(this, password);
    }

    get username() {
      return _username.get(this);
    }

    get password() {
      return _password.get(this);
    }

    getAuthHeaders(headers = {}) {
      const base64Map = {
        nodejs(str) {
          return Buffer.from(str, 'utf8').toString('base64');
        },
        gas(str) {
          return Utilities.base64Encode(str);
        },
        unknown() {
          throw new Error(
            'Library can only run in Google Apps Script runtime environment'
          );
        },
      };
      const encode = base64Map[SETTINGS.runtime()];
      return {
        ...headers,
        Authorization: `Basic ${encode(this.username + ':' + this.password)}`,
      };
    }
  }

  class BearerAuth extends Auth {
    constructor(token) {
      super();
      _token.set(this, token);
    }

    getAuthHeaders(headers = {}) {
      return {
        ...headers,
        Authorization: `Bearer ${this.token}`,
      };
    }

    get token() {
      return _token.get(this);
    }
  }

  return {
    Token,
    BasicAuth,
    BearerAuth,
  };
})();

if ('undefined' !== typeof module)
  module.exports = {
    Token: Auth.Token,
    BasicAuth: Auth.BasicAuth,
    BearerAuth: Auth.BearerAuth,
  };
