# Google App Script Frameowrk

The library exists to facilitate the impleentation of an application on the Google App Script platform.

The library is composed of three parts: **server**, **client** and **mocking**.

## Server

On the server side (Google App Script) use the function **createGasApp(methods)** to build an object with the following type:

```ts
export type GasApp = {
  invoke(name: string, ...params: any[]): any;
};
```

The function configures a map of functions scoped by the library that can be invoked indirectly throgh the method **invoke**

The **invoke** method of the returned object allows to call a scoped function by name.

On the server side is also avilable the function **include** that produces an _HtmlTemplate_ from a file and return the evaluated content. Can be used to include/import files in an html template.

In order to use the module functions they must be exposed with a global scope function.

```ts
import { createGasApp, include } from "@gcanossa/gas-app/server";

const app = createGasApp({
  sum(a: number, b: number) {
    return a + b;
  },
});

function appinvoke(...params: any[]): any {
  return app.invoke(...params);
}

function myInclude(...params: any[]): string {
  return include(...params);
}
```

## Client

On the client side (an Html page served from Google App Script) are available:

- **createBridge<T extends GasServerApiRunMethods>()**: implements a Proxy getting type inference for the server side functions through the standard _window.google.script_ interface. Every function returns a Promise<\[result, userObject\]> and comes in two flavours: \<name\>(...args) and ctx\_\<name\>(userObject, ...args).
- **createGasAppBridge<T extends GasServerApiRunMethods>(invokeFunctionName: string)**: does the same thing ad _createBridge_, but for the functions scoped with _GasApp **init**_ and called throgh _GasApp **invoke**_. The parameter _invokeFunctionName_ is the name of the functio used to expose the _invoke_ method.

## Mocking

On the client side (an Html page served from Google App Script) the function **initMocks(mocks, appMocks)** initialize a mock _window.google.script_ object applying the mocks typing. The two configuration parameters are maps of functions which mocks the server side one. The parameter _appMocks_ is a map of functions maps which mocks one or multiple server side gas app. Each key is the name of the function exposing _invoke_.

## Usage

On the server side (Google App Script) create the desired functions:

```js
function sum(a, b) {
  return a + b;
}

function sub(a, b) {
  return a - b;
}

function mul(a, b) {
  return a * b;
}

function div(a, b) {
  return a / b;
}
```

If necessary scope the with the library:

```ts
export type ScopedServerFn = {
  sum: typeof sum;
  mul: typeof mul;
};
export type ServerFn = {
  sub: typeof sub;
  div: typeof div;
};

const app = createGasApp<ScopedServerFn>({ sum, mul };

function myApp(...params:any[]){
  return app.invoke(...params);
}
```

On the client create the bridges using the server side exported type:

```ts
import { ScopedServerFn, ServerFn } from "./code.ts";

const bridge = createBridge<typeof ServerFn>();
const coreBridge = createGasAppBridge<typeof ScopedServerFn>();
```

Init the mocks in _development_ mode:

```ts
if(import.meta.env.DEV){ //expample using with vite
  const gas = initMocks<typeof ServerFn>({
    async sum(a, b) { // NOTE: must be a Promise for every mock to mimic server behaviour
      return a + b;
    },
    ...
  }, {
    myApp:{
      ...
    }
    ...
  });
}
```

Call the methods:

```ts
const [res, _] = await bridge.sum(1, 2);
const [res2, { val }] = await bridge.ctx_sum({ val: "test" }, 1, 2);

const [re3, _] = await appBridge.mul(1, 2);
const [res4, { msg }] = await appBridge.ctx_mul({ msg: "test" }, 1, 2);
```

## Usage in Html template

If you need to include/import a file into another Html template, use the *function exposing the *include\*\* function:

main.html

```html
...

<?!= myInclude('path/to/file', { val: 3 }) ?>
...
```

path/to/file.html

```html
<h1>Title</h1>

<p>
  Value is:
  <?= val ?>
</p>
```

## Vite plugin

The library contains also a vite function plugin **viteGasApp** which allows to create simple html pages to be renderd by Google Apps Script.

The plugin explores the _input_ path and expect a structure like this:

```
/<input>
  /ui
    global.css
    app.js
    utils.js
    /page1
      view.html
      script.js
      style.css
    /page2
      view.html
      script.js
      style.css
```

Basically a set of .html, .css and .js inside a **ui** folder. The plugin reproduce the same hierarchy in the _destination_ folder wrapping .js files in \<script\>\</script\> tags and .css in \<style\>\</style\> tags and renaming the files in .js.html and .css.html. The script searches the .html files for \<script\> and \<style\> tags with the attribute **x-gas-include**, if found rewrites the tag using the scriptlet \<?!= myInclude(...) ?> (example name) effectively inlining the resource. This allows a comfortable local development inlcuding the .js and .css files from the filesystem and an organized clasp folder keeping the script and style resources separated like in local development.
