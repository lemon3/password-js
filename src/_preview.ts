import './style.css';
import { password } from './index.ts';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>Random Password</h1>
    <div id="result"></div>
    <button class="user-select-none" id="generate" type="button">generate new</button>
  </div>
`;

const init = () => {
  const result = document.querySelector('#result');
  const generate = document.querySelector('#generate');

  const pwd = password();
  const createNew = (evt?: Event) => {
    if (evt) {
      evt.preventDefault();
    }

    const myPassword = pwd.create();
    if (result) {
      result.textContent = `${myPassword.password}`;
    }
  };
  createNew();

  if (generate) {
    generate.addEventListener('click', createNew);
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
