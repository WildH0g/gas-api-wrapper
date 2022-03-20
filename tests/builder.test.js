// jshint esversion: 9
// jshint laxbreak: true

/****************************************
 * SET UP
 ****************************************/

const Api = require('../src/APIBuilder');
const URL = 'https://www.example.com';
let OPTIONS = {
  type: 'KeyToken',
  addTo: 'query',
  token: { name: 'token', value: 'tokenValue' },
  secret: { name: 'secret', value: 'secretValue' },
};

/*****************************************
 *  WRAP API IN DEBUG MODE
 *****************************************/

const wrapper = new Api(URL, OPTIONS);

const keyTokenQuery = wrapper
  // get method path and header
  .addMethod('getUsers', {
    path: '/users',
    headers: { Accept: 'application/json' },
  })
  // method with a parameter in the path
  .addMethod('getUserById', {
    path: '/users/{{userId}}',
  })
  // add a query parameter
  .addMethod('findUserByName', {
    path: '/users',
    queryParams: {
      name: '{{userName}}',
    },
  })
  // multiple parameters in query string and path
  .addMethod('findUsersByCriteria', {
    path: '/users',
    queryParams: {
      first_name: '{{firstName}}',
      age: '{{age}}',
      gender: '{{gender}}',
    },
  })
  // send payload with POST method
  .addMethod('addUser', {
    path: 'users',
    method: 'POST',
    payload: {
      firstName: '{{firstName}}',
      age: '{{age}}',
      gender: '{{gender}}',
    },
  })
  // add an array of users
  .addMethod('addUsers', {
    path: 'users',
    method: 'POST',
    payload: '{{usersArray}}',
  })
  .build()
  .debugModeOn();

/*******************************************
 * RUN TESTS
 *******************************************/

describe('Wrapping a new API of KeyToken auth type and addTo query', () => {
  it('Instance creation', () => {
    expect(keyTokenQuery.baseUrl).toBe(URL);
    expect(keyTokenQuery.auth.name).toBe(OPTIONS.type);
  });

  it('Checking a simple get method', () => {
    const users = keyTokenQuery.getUsers();
    expect(users.path).toBe('/users');
    expect(users.url).toBe(
      'https://www.example.com/users?token=tokenValue&secret=secretValue'
    );
    expect(users.headers).toEqual({ Accept: 'application/json' });
    expect(users.method).toBe('GET');
  });

  it('Parameter in path', () => {
    const userById = keyTokenQuery.getUserById({ userId: 'exampleUserId' });
    expect(userById.path).toBe('/users/exampleUserId');
  });

  it('Parameter in query string', () => {
    const userByName = keyTokenQuery.findUserByName({ userName: 'Jose' });
    expect(userByName.url).toBe(
      'https://www.example.com/users?token=tokenValue&secret=secretValue&name=Jose'
    );
  });

  it('Multiple parameters in query', () => {
    const userSearch = keyTokenQuery.findUsersByCriteria({
      firstName: 'Jose',
      age: 35,
      gender: 'male',
    });
    expect(userSearch.queryString).toBe('first_name=Jose&age=35&gender=male');
    expect(userSearch.url).toBe(
      'https://www.example.com/users?token=tokenValue&secret=secretValue&first_name=Jose&age=35&gender=male'
    );
  });

  it('Unused parameters are removed from query string', () => {
    // no age parameter
    const userSearch = keyTokenQuery.findUsersByCriteria({
      firstName: 'Jose',
      gender: 'male',
    });
    expect(userSearch.queryString).toBe('first_name=Jose&gender=male');
    expect(userSearch.url).toBe(
      'https://www.example.com/users?token=tokenValue&secret=secretValue&first_name=Jose&gender=male'
    );
  });

  it('POST method with payload', () => {
    const userOptions = {
      firstName: 'Georgina',
      gender: 'female',
      age: '22',
    };
    const newUser = keyTokenQuery.addUser(userOptions);
    expect(newUser.method).toBe('POST');
    expect(JSON.parse(newUser.payload)).toEqual(userOptions);
  });

  it('POST method with unused params in payload', () => {
    const userOptions = {
      firstName: 'Georgina',
      age: '22',
    };
    const newUser2 = keyTokenQuery.addUser(userOptions);
    expect(newUser2.method).toBe('POST');
    expect(JSON.parse(newUser2.payload)).toEqual(userOptions);
  });
});

OPTIONS.addTo = 'headers';
delete OPTIONS.secret;
const keyTokenHeader = new Api(URL, OPTIONS);
const instance2 = keyTokenHeader
  // get method path and header
  .addMethod('getUsers', {
    path: '/users',
    headers: { Accept: 'application/json' },
  })
  .build()
  .debugModeOn();

describe('KeyToken auth type and addTo headers', () => {
  it('Check headers and query string', () => {
    const users = instance2.getUsers();
    expect(users.headers).toEqual({
      Accept: 'application/json',
      token: 'tokenValue',
    });
    expect(users.queryString).toBeFalsy();
    expect(users.url).toBe(URL + users.path);
  });
});

const basic = new Api(URL, {
  type: 'Basic',
  username: 'username',
  password: 'password',
});

const instance3 = basic
  // get method path and header
  .addMethod('getUsers', {
    path: '/users',
    headers: { Accept: 'application/json' },
  })
  .build()
  .debugModeOn();

describe('Testing Basic Auth ', () => {
  it('Headers, queryString and URL', () => {
    const users = instance3.getUsers();
    expect(users.headers).toEqual({
      Accept: 'application/json',
      Authorization: 'Basic dXNlcm5hbWU=:cGFzc3dvcmQ=',
    });
    expect(users.queryString).toBeFalsy();
    expect(users.url).toBe(URL + users.path);
  });
});

const bearer = new Api(URL, {
  type: 'Bearer',
  token: 'token',
});

const instance4 = bearer
  .addMethod('getUsers', {
    path: '/users',
    headers: { Accept: 'application/json' },
  })
  .build()
  .debugModeOn();

describe('Testing Bearer Auth', () => {
  it('Headers, query string and URL', () => {
    const users = instance4.getUsers();
    expect(users.headers).toEqual({
      Accept: 'application/json',
      Authorization: 'Bearer token',
    });
    expect(users.queryString).toBeFalsy();
    expect(users.url).toBe(URL + users.path);
  });
});



















  //working space