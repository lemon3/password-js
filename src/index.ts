import './style.css';
import { Options, type PasswordStrength } from '../lib/types';
import { password } from '../lib/index';

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
  let prevColorClass: string;

  const update = (pw: PasswordStrength) => {
    if (strengthResult) {
      const percent = 100 * pw.strength;
      const fixedP = +percent.toFixed(0);
      strengthResult.textContent = 0 === pw.entropy ? '' : `${fixedP}%`;
      strengthBar.style.width = '' + percent + '%';

      console.log(pw.statistic);
      let colorClass: string = 'p0';

      if (fixedP < 20) {
        colorClass = 'p0';
      } else if (fixedP < 40) {
        colorClass = 'p20';
      } else if (fixedP < 60) {
        colorClass = 'p40';
      } else if (fixedP < 80) {
        colorClass = 'p60';
      } else if (fixedP <= 100) {
        colorClass = 'p80';
      }

      strengthBar.classList.remove(prevColorClass);
      strengthBar.classList.add(colorClass);
      prevColorClass = colorClass;
    }
  };

  const test = () => {
    if (!testPassword) return;
    const pw = pwd.test(testPassword.value);
    update(pw);
  };

  const createNew = (evt?: Event) => {
    if (evt) evt.preventDefault();
    const options: Options = {
      length: 12,
      normalDistribute: !true,
      // lowercaseWeight: 13,
      // uppercaseWeight: 13,
      // numbersWeight: 0,
      // symbolsWeight: 13,
      // umlautsWeight: 0,
    };
    const pw = pwd.create(options);
    testPassword.value = `${pw.password}`;
    update(pw);
  };
  createNew();

  if (generate && testPassword) {
    generate.addEventListener('click', createNew);
    testPassword.addEventListener('input', test);
  }
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
