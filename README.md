# API Wrapper for Google Apps Script

Create a Google Apps Script SDK from any JSON RESTful API.

## About

There is never a Google Apps Script SDK made available for the best APIs out there. It's time to start changing that, hence this library that allows to build an SDK out of any JSON-based RESTful API.

A detailed article with examples can be found [in my story on Medium](https://dmitry-kostyuk.medium.com/904be20f0dd7?sk=9c45dcfeadec25c3984f604dac793200).

## Install

Option 1: clone this repo into your project and [bundle it into your GAS project](https://medium.com/geekculture/the-ultimate-guide-to-npm-modules-in-google-apps-script-a84545c3f57c?sk=7860f498c3560932ac0a2a6a61af9b90)

Option 2: Copy the already-bundled `APIWrapper.js` file into your project.

## Usage

```js
function mySDK() {
  return new APIWrapperBuilder(`<<base url>>`, <<authentication object>>)
    .addMethod('methodNameOne', <<method options>>)
    .addMethod('methodNameTwo', <<method options>>)
    .build();
}

function execute() {
  mySDK().methodNameOne(<<argsObj>);
}
```

1. Create an instance of `API Wrapper Builder` providing a base URL (must not contain a slash at the end) and authentication options
1. Use method chaining to define your methods
1. The library uses the Builder pattern, it requires the the `APIWrapperBuilder` instance to use the `build()` method in the end to convertg it the the `APIWrapper` class.

## Authentication

GAS API Wrapper supports three types of authentication:

1. Token with or without a secret as part of the query string or header.
1. Basic authentication.
1. Bearer authentication.

### Token Authentication

```js
const apiWrapperBuilder =
  new APIWrapperBuilder(<<base url>>, {
      type: 'KeyToken',
      addTo: 'query',
      token: { name: '<<token name>>', value: '<<token value>>' },
      secret: { name: '<<secret name>>', value: '<<secret value>>' },
    });
```

The Token authentication, named `KeyToken` in the library, suppors the following options:

- `addTo` (required): supports two values: `query` or `headers` depending on where the API requires you to add the token, the query string or headers respectively
- `token` (required): an object that contains 2 values, the token name and its value; for example `{name: 'token', value='qwerty'}` in a query string will be evaluated to `token=qwerty`
- `secret` (optional): some APIs also require a secret to be added together with the token; the syntax works in the same way as the token.

### Basic Authentication

```js
const apiWrapperBuilder =
  new APIWrapperBuilder(<<base url>>, {
      type: 'Basic',
      username: '<<user name>>',
      password: '<<password>>',
    })
```

To use Basic authorization, set type to `Basic` and supply a user name and a password in the auth options.

### Bearer Authetication

```js
const apiWrapperBuilder =
  new APIWrapperBuilder(<<base url>>,
      {
        type: 'Bearer',
        token: '<<Bearer token>>',
      }
    )
```

To use Bearer authorization, set type to 'Bearer' and supply the `Bearer` token in the auth options.

## Creating Methods

The custom methods are defined with the `addMethod()` method, that takes a method name and options arguments.

### Basic Syntax

```js
apiWrapperBuilder
  .addMethod('addUser', {
    method: 'POST',
    path: '/users',
    payload: {
      name: 'John',
      age: 33,
    },
    headers: {
      'Content-Type': 'application/json',
    },
    queryParams: {
      key: 'value',
    },
  })
  .build();
```

Method name must be a string.

The `options` object takes the following entries:

- `method`: required HTTP method, typically `GET`, `POST`, `PUT` or `DELETE`
- `path`: the endpoint you are querying
- `payload`: the payload object
- `headers`: the headers object
- `queryParams`: the key-value pair object that is transformed into a query string

### Using Dynamic Values

Dynamic values can be used in the `path`, `payload` or `queryParam` entries with mustache notation:

```js
const methodOptions = {
  method: 'PUT',
  path: '/users/{{userId}}',
  payload: {
    name: '{{userName}}',
  },
  queryParams: {
    metaData: '{{metaData}}',
  },
};
```

A method defined with such optioins can be called like so:

```js
mySDK().myMethod({
  userId: 'xxx',
  name: 'Jane',
  metdaData: 'yyy',
});
```

All dynamic values are optional and the entries are removed from the requrest if not used.

## Projects Built with the API Wraper for Google Apps Script

- [Google Apps Script API Wrapper for Canvas LMS](https://github.com/Mr-C-Teaches-CS/gas-api-wrapper-canvas-lms)

## Contributing

If you would like to contribute, I am looking for help in the following areas.

Find any edge-cases that dont't work and help me solve them.

Create SDKs with this library and add them to this README.

## Version

0.1.1
