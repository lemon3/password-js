import './style.css';
import { password, type PasswordStrength } from '../lib/index.ts';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>Random Password</h1>
    <div class="button-group">
      <button class="user-select-none" id="generate" type="button">generate new</button>
    </div>

    <div class="password-wrapper">
      <input id="test-password" type="text" />
      <div class="strength-bar-wrapper">
        <div class="strength-bar" id="strength-bar"></div>
      </div>
    </div>
    <div id="strength-result"></div>

  </div>


`;

const init = () => {
  const generate = document.querySelector('#generate');
  const testPassword = document.querySelector(
    '#test-password'
  ) as HTMLInputElement;
  const strengthResult = document.querySelector('#strength-result');
  const strengthBar = document.querySelector('#strength-bar') as HTMLElement;

  const pwd = password();

  const update = (pw: PasswordStrength) => {
    if (strengthResult) {
      const percent = 100 * pw.strength;
      strengthResult.textContent =
        0 === pw.entropy ? '' : '' + percent.toFixed(0);
      strengthBar.style.width = '' + percent + '%';
    }
  };

  const test = () => {
    if (!testPassword) return;
    const pw = pwd.test(testPassword.value);
    update(pw);
  };

  const createNew = (evt?: Event) => {
    if (evt) evt.preventDefault();
    const pw = pwd.create({ length: 10, normalDistribute: !true });
    testPassword.value = `${pw.password}`;
    update(pw);
  };
  createNew();

  if (generate && testPassword) {
    generate.addEventListener('click', createNew);
    testPassword.addEventListener('input', test);
  }

  // const myPassword = '.Pa55-W0rD';
  // const testing = pwd.test(myPassword);
  // console.log(testing);
};

if (
  'complete' === document.readyState ||
  'interactive' === document.readyState
) {
  init();
  document.removeEventListener('DOMContentLoaded', init);
} else {
  document.addEventListener('DOMContentLoaded', init, false);
}
