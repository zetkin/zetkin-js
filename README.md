# Zetkin javascript SDK
This is the javascript SDK for the Zetkin Platform for organizing activism. Use
it to build applications on top of the Zetkin Platform. The SDK can be used in the browser (via Browserify) as well as in Node.

## At a glance
```javascript
var email = 'testadmin@example.com';
var pwd = 'password';

Z.authenticate(email, pwd)
  .then(function(res) {
    // Successfully authenticated
    Z.resource('/users/me').get()
      .then(function(res) {
        console.log(res.data);
      })
      .catch(function(err) {
        console.log('error! ' + err.httpStatus);
        console.log(err.data);
      });
  });
```

## Installation
Install the Zetkin javascript SDK via npm.

```
npm install zetkin
```

## Authentication
In the Zetkin Platform API, authentication is a matter of creating a session by issuing a `POST` request to `/session` using the Basic HTTP Authorization scheme. A token is returned, and this will need to be sent along with all further requests.

The SDK abstract away most of this. The special `authenticate()` method is a shortcut for authenticating and storing the token to be used in all subsequent requests.

```javascript
Z.authenticate('testadmin@example.com', 'password');
```

The `username` and `password` arguments must be strings, or the function will throw a `TypeError`. The method returns a promise like any other request (keep reading for details).

## Resource proxies and requests
In the SDK, API resources are represented by proxies created by the `resource()` function. Requests can be made to resources using methods on the proxy representing the HTTP verbs.

```javascript
Z.resource('/orgs/1/people').get();
```

### Request fundamentals
Requests return promises, which follow the normal promise conventions. Both the resolve and reject methods receive a single argument, an object with a `data` and a `httpStatus` attribute. A third attribute, `meta` is less self-explanatory but is covered later in this document.

The `data` attribute can be anything depending on what (if anything) was returned by the request, and the `httpStatus` attribute is the numeric HTTP response code.

```javascript
function onComplete(res) {
  console.log(res.data, res.httpStatus);
}
Z.resource('/orgs/1/people').get().then(onComplete);
```

Some HTTP verbs support request data, i.e. `POST`, `PUT` and `PATCH`. These request methods accept two (optional) arguments, `data`, and `callback`.

```javascript
function onComplete(res) {
  console.log(res.data, res.httpStatus);
}

var requestData = { first_name: 'Clara' };
Z.resource('/orgs/1/people').post(requestData).then(onComplete);
```

### Composing resource paths
The resource path (e.g. `/orgs/1/people`) can be passed to `Z.resource()` as a string, or as an arguments list which will be joined with a slash delimiter. This is nice when you have variable segments and want to avoid string concatenation.

```javascript
var org_id = 1, person_id = 255;
var res0 = Z.resource('/orgs/' + org_id + '/people/' + person_id);
var res1 = Z.resource('orgs', org_id, 'people', person_id);

console.log(res0.getPath() === res1.getPath()); // true
```

Both methods yield the same result, but you might find the second version without the slashes and + signs nicer and easier to read.

### Making the most of resource proxies
The objects returned by `Z.resource()` are called _resource proxies_. They can be reused for any number of requests, and even stored as part of your data model for shorter, more readable code.

```javascript
function Person(id) {
  // Constructor. Store the resource proxy on instance for reuse.
  this.resource = Z.resource('/orgs/1/people', id);
}

var person1 = new Person(1);
var person2 = new Person(2);

person1.resource.patch({ first_name: 'Clara' });
person2.resource.delete();
```

Whether this makes sense will depend on your application architecture, but ain't it nice to have options?

### Passing meta-data to callbacks
Oftentimes when your request finishes and the promise resolves you need to know more about the context in which the request was made. The resource proxy meta-data exists for this purpose. You can add any meta-data to a resource proxy and it will be passed in the `res` or `err` object when the promise is resolved or rejected.

```javascript
function onComplete(res) {
  console.log(res.meta.org_id); // 4
}

Z.resource('/orgs/4/people')
  .meta('org_id', 4)
  .get()
  .then(onComplete);
```

The `meta()` method can be passed a key-value pair like above, or a full object, in which case the contents will be copied to the internal meta object.

```javascript
Z.resource('/orgs/4/people').meta({
  // My custom meta-data
  org_id: 4,
  reason: 'search',
  redir_on_success: '/done'
}).get();
```

This allows you to send along complex meta-data to your callbacks.

## Advanced use
In most cases, nothing more than getting hold of the `Z` object and authenticating via `authenticate()` is necessary. However to some users, there might be cases where one would want to configure the SDK or create multiple instances to talk to separate back-ends.

### Reconfigure SDK
The `configure()` function allows some options to be reconfigured from their usually reasonable defaults.

```javascript
Z.configure({
  host: 'api.dev.zetk.in',
  ssl: false
});
```
The available options are:
* `base`: the base path, or path prefix, on the server. The default is no prefix (empty string).
* `host`: the hostname of the Zetkin Platform API server. The default is _api.zetk.in_.
* `port`: the port on which the API listens. The default is _443_.
* `ssl`: Whether to connect using HTTPS (true) or HTTP (false). The default is _true_, i.e. to connect securely using HTTPS.

### Running multiple instances
If your application requires several users to be authenticated at the same time (multiple sessions), or to have different requests be made to separate back-ends (multiple configurations) you can create separate instances.

The `construct()` function creates a new `Z` instance and returns it. You will need to store a reference to it yourself.

```javascript
var AdminZ = Z.construct();

Z.authenticate('testuser@example.com', 'password');
AdminZ.authenticate('testadmin@example.com', 'password');
```

As a convenience, a `config` object can be passed to the `construct()` function directly.

```javascript
var DevZ = Z.construct({
  host: 'api.dev.zetk.in',
  ssl: false
});
```

## Contributing
If you want to contribute to the Zetkin Javascript SDK, make a fork and use `npm install` to install the dependencies. Make your changes, make sure that they are properly tested and that all tests pass by running `npm test`, and then make a pull request back to the master branch of this repository.
