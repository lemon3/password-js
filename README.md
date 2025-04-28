# Random Password Generator
Modern, customizable password generator with entropy analysis and flexible character group settings.

## Import to your project
```bash
pnpm add pwkit;
```

## Usage

### generate a password
```js
import { password } from "pwkit";

// initialize
const pwd = password();

// use with default settings
console.log(pwd.create());
```

more advanced usage
```js
import { password } from "pwkit";

const pwd = password();
const options = {
  // see all available options below
};
console.log(pwd.create(options));
```

### Test a password
```js
import { password } from "pwkit";

const pwd = password();
const myPassword = '.Pa55-W0rD';
const result = pwd.test(myPassword);

console.log(result);
```

## Methods

### create()
```js
const pwd = password();
const myPassword = pwd.create();

console.log(myPassword);
// returns, e.g.:
// {
//   password: 'BISMQh^g4F',
//   entropy: 65.23561956057013
// }
```

### test(string)
```js
const pwd = password();
const myPassword = '.Pa55-W0rD';

const test = pwd.test(myPassword);
console.log(tmp);
// returns:
// {
//   entropy: 65.23561956057013
//   length: 10
//   statistic: {
//     lowercase: 2
//     numbers: 3
//     symbols: 2
//     umlauts: 0
//     uppercase: 3
//   },
//   strength: 0.6523561956057012
// }
```

## options
```js
options = {
  // the length of the password
  // default: 10
  length: 10,

  // should lowercase chars be included
  // values: true | false | number
  // e.g.: 3 (use at least 3 chars from the lowercase character-set)
  // default: true
  lowercase: true,

  // should uppercase chars be included
  // values: true | false | number
  // e.g.: 3 (use at least 3 chars from the uppercase character-set)
  // default: true
  uppercase: true,

  // should numbers chars be included
  // values: true | false | number
  // e.g.: 3 (use at least 3 chars from the numbers character-set)
  // default: true
  numbers: true,

  // should symbols chars be included
  // values: true | false | number
  // e.g.: 3 (use at least 3 chars from the symbols character-set)
  // default: true
  symbols: true,

  // should umlauts chars be included
  // values: true | false | number
  // e.g.: 3 (use at least 3 chars from the umlauts character-set)
  // default: false
  umlauts: false,

  // exclude similar looking characters like '0' and 'O'
  // values: true | false
  // default: false
  excludeSimilar: false,

  // try to distribute normal over the the selected character-sets!
  // e.g.: if set to true, length set to 16, and lowercase, uppercase, numbers, and symbols are set to true. We get 4 lowercase, 4 uppercase, 4 numbers and 4 symbols in the resulting password
  // values: true | false
  // default: false
  normalDistribute: false,
}
```
