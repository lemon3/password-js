import './style.css';
import { Options, type PasswordStrength } from '../lib/types';
import { password, charGroups } from '../lib/index';
import { copyTextToClipboard } from './utils';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1 class="heading">PWkit</h1>
    <p>a tool for creating and testing passwords!</p>
    <div class="password-wrapper">
      <div id="result"></div>
      <div class="strength-bar-wrapper">
        <div class="strength-bar" id="strength-bar"></div>
      </div>
    </div>
    <div id="strength-result"></div>
    <h2>Password length</h2>
    <div class="range-element">
      <input
        type="range"
        id="password-length-slider"
        min="1"
        max="20"
        value=""
        step="1"
      />
      <div class="range-label min-range" id="min-range">1</div>
      <div class="range-label max-range" id="max-range">20</div>
    </div>
    <div id="length-value"></div>
    <div class="button-group">
      <button class="usn" id="copy" type="button">copy</button>
      <button class="usn" id="generate" type="button">generate</button>
    </div>


    <h2>Character groups</h2>
    <p>Select the character groups to be used when creating the password!</p>
    <div class="checkboxes">
      <label class="checkbox">
        <input type="checkbox" name="lowercase" class="setter" />
        <span class="toggle-label lowercase"></span>
        <span class="checkbox-label lowercase user-select-none"
          >Lowercase [a-z]</span
        >
      </label>
      <label class="checkbox">
        <input type="checkbox" name="uppercase" class="setter" />
        <span class="toggle-label uppercase"></span>
        <span class="checkbox-label uppercase user-select-none"
          >Uppercase [A-Z]</span
        >
      </label>
      <label class="checkbox">
        <input type="checkbox" name="numbers" class="setter" />
        <span class="toggle-label numbers"></span>
        <span class="checkbox-label numbers user-select-none"
          >Numbers [0-9]</span
        >
      </label>
      <label class="checkbox">
        <input type="checkbox" name="symbols" class="setter" />
        <span class="toggle-label symbols"></span>
        <span class="checkbox-label symbols user-select-none"
          >Symbols</span
        >
      </label>
      <label class="checkbox">
        <input type="checkbox" name="umlauts" class="setter" />
        <span class="toggle-label umlauts"></span>
        <span class="checkbox-label umlauts user-select-none"
          >Umlauts</span
        >
      </label>
    </div>
  </div>
`;

const init = () => {
  const store = localStorage.getItem('settings');
  const options: Options = store
    ? JSON.parse(store)
    : {
        length: 12,
        lowercase: 1,
        uppercase: 1,
        numbers: 1,
        symbols: 1,
        umlauts: false,
        excludeSimilar: true,
        normalDistribute: false,
      };

  const generateBtn = document.querySelector('#generate');
  const copyBtn = document.querySelector('#copy') as HTMLButtonElement;
  const result = document.querySelector('#result') as HTMLInputElement;
  const passwordLengthSlider = document.querySelector(
    '#password-length-slider'
  ) as HTMLInputElement;
  const strengthResult = document.querySelector('#strength-result');
  const strengthBar = document.querySelector('#strength-bar') as HTMLElement;
  const setter = document.querySelectorAll(
    '.setter'
  ) as NodeListOf<HTMLInputElement>;
  const lengthValueEL = document.querySelector('#length-value') as HTMLElement;
  const minRange = document.querySelector('#min-range') as HTMLDivElement;

  const pwd = password(options);
  let minPasswordLength = 0;
  let prevColorClass: string;

  const generatePasswordHTML = (password: string) => {
    // Generate HTML output with span wrappers
    let html = '';
    const groupStatistic: any = {};
    for (const char of password) {
      let groupClass = '';
      for (const [group, chars] of Object.entries(charGroups)) {
        if (chars.includes(char)) {
          if (!groupStatistic[group]) groupStatistic[group] = 0;
          groupStatistic[group] += 1;
          groupClass = group;
          break;
        }
      }
      html += `<span class="${groupClass}">${char}</span>`;
    }
    // console.log(groupStatistic);
    return html;
  };

  const copyPassword = (evt: Event) => {
    evt.preventDefault();
    evt.stopPropagation();

    if (!result) return;
    const text = result.dataset.pwd;
    if (!text || !copyBtn) return;

    copyTextToClipboard(text)
      .then(() => {
        copyBtn.textContent = '✔ Copied!';
        const timeOut = setTimeout(() => {
          clearTimeout(timeOut);
          copyBtn.textContent = 'Copy';
          copyBtn.blur();
        }, 2000);
      })
      .catch((err) => {
        console.error('Copy failed:', err);
      });
  };

  const updateInfo = (pw: PasswordStrength) => {
    if (strengthResult) {
      const percent = 100 * pw.strength;
      const fixedP = +percent.toFixed(0);
      strengthResult.textContent = 0 === pw.entropy ? '' : `${fixedP}%`;
      strengthBar.style.width = '' + percent + '%';

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

  const sliderUpdate = (evt) => {
    const value = evt.target.value;
    options['length'] = value;
    lengthValueEL.innerHTML = Math.max(
      minPasswordLength,
      options.length || 0
    ).toString();
    update(false);
  };

  const save = () => localStorage.setItem('settings', JSON.stringify(options));

  const calcMinPasswordLength = () =>
    Math.max(
      1,
      Object.values(setter).reduce(
        (prev, next) => prev + +(next.checked ? 1 : 0),
        0
      )
    );

  const update = (updateMin = true) => {
    if (updateMin) {
      minPasswordLength = calcMinPasswordLength();

      lengthValueEL.innerHTML = passwordLengthSlider.value = Math.max(
        minPasswordLength,
        options.length || 0
      ).toString();

      minRange.innerHTML = passwordLengthSlider.min =
        minPasswordLength.toString();
    }
    save();
    pwd.updateSettings(options);
    createNew();
  };

  const createNew = (evt?: Event) => {
    if (evt) evt.preventDefault();
    const pw = pwd.create();
    if (pw.password === '') {
      result.innerHTML = `<span class="error">No Character group selected!</span>`;
      result.dataset.pwd = '';
    } else {
      result.innerHTML = generatePasswordHTML(pw.password);
      result.dataset.pwd = pw.password;
    }

    updateInfo(pw);
  };

  const getNumber = (value: string | boolean | number): number =>
    value === true ? 1 : Number(value);

  setter.forEach((el) => {
    const name = el.name;
    const startValue = getNumber((options as any)[name]);
    const boxChecked = Boolean(startValue || startValue >= 1);
    el.checked = boxChecked;

    el.addEventListener('click', (evt: Event) => {
      const target = evt.currentTarget as HTMLInputElement;
      const checked = target.checked;
      (options as any)[target.name] = checked ? 1 : 0;
      update();
    });
  });

  minPasswordLength = calcMinPasswordLength();

  if (options.length) {
    lengthValueEL.innerHTML = passwordLengthSlider.value =
      options.length.toString();
    passwordLengthSlider.min = minPasswordLength.toString();
  }

  if (minRange) {
    minRange.innerHTML = minPasswordLength.toString();
  }

  if (generateBtn && copyBtn && result && passwordLengthSlider) {
    copyBtn.addEventListener('click', copyPassword);
    generateBtn.addEventListener('click', createNew);
    result.addEventListener('click', copyPassword);
    passwordLengthSlider.addEventListener('input', sliderUpdate);
  }

  createNew();
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
