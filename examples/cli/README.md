# Command-line implementation of Zetkin SDK
This simple code sample is a command-line interface to the Zetkin SDK. It lets
you interface with the Zetkin API using a very simple (and dumb) REPL-like
shell.

## Running the example
This is an example session. The commands `npm start`, `login`, `auth [url]` and
`get /orgs/1` are written by the user. All other text is printed by the program.

The session is excited using ctrl + C.

```
$ npm start

> zetkin-js-cli-example@1.0.0 start /Users/richardolsson/src/zetkin/lib/zetkin-js/examples/cli
> node .

login
Login here, and authenticate with: auth <redir_url>
http://api.dev.zetkin.org/oauth/authorize/?client_id=efbc3f9d4ea444016391ccd7611ff871&redirect_uri=http%3A%2F%2Fwww.dev.zetkin.org%2Foauth%2F&scope=&response_type=code&state=
auth http://www.dev.zetkin.org/oauth/?code=rPfRpMyKQLOjcRaXlDheqw
get /orgs/1
{ data:
   { data:
      { title: 'My Organization',
        parent_id: null,
        is_open: true,
        country: 'SE',
        slug: 'myorg',
        id: 1 } },
  meta: {},
  httpStatus: 200 }
^C
```

## Commands
### `login`
This command prints a valid login URL for the development environment. The user
should navigate to this URL with a web browser and enter valid credentials, e.g.
username `testadmin@example.com` and password `password`.

After logging in, the user will be redirected to a URL which the user should
capture and submit to the program using the `auth` command.

### `auth <redir_url>`
This command accepts a single argument which is the URL to where the user is
redirected after logging in (at the URL provided by the `login` command). The
`redir_url` will be parsed, the code extracted and verified with the API. For
the rest of the session, requests will be made by the authenticated user.

### `get <path>`
Perform a simple HTTP `GET` request to the API resource provided by `path` and
print the data returned by the request.

### `token`
Print the OAuth2 token information
