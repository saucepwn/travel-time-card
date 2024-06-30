class TravelTimeCard extends HTMLElement {
  static SELECTOR = 'travel-time-card';

  // private variables
  _config;
  _hass;
  _elements = {};

  constructor() {
    super();
    this.doCard();
    this.doStyle();
    this.doAttach();
    this.doQueryElements();
  }

  // required
  setConfig(config) {
    this._config = config;

    if (!this._config.entity) {
      throw new Error('Required field: entity');
    }

    if (this._config.imageUrl) {
      const img = document.createElement('img');
      img.src = this._config.imageUrl;
      img.height = 100;
      this._elements.destination.append(img);
    } else if (this._config.title) {
      const title = document.createElement('p');
      title.innerText = this._config.title;
      this._elements.destination.append(title);
    } else {
      this._elements.destination.classList.add('hidden');
    }
  }

  set hass(hass) {
    this._hass = hass;
    this.doUpdateHass();
  }

  doCard() {
    this._elements.card = document.createElement('ha-card');
    this._elements.card.innerHTML = `
      <div class="card-content">
        <div class="destination"></div>
        <span class="current-time"></span>
        <span class="standard-time"></span>
      </div>
    `;
  }

  doQueryElements() {
    const card = this._elements.card;

    this._elements.destination = card.querySelector('.destination');
    this._elements.card_content = card.querySelector('.card-content');
    this._elements.standard_time = card.querySelector('.standard-time');
    this._elements.current_time = card.querySelector('.current-time');
  }

  getBackgroundImageCss() {
    if (this._config?.imageUrl) {
      return `url("${this._config.imageUrl}")`;
    } else {
      return 'none';
    }
  }

  doStyle() {
    this._elements.style = document.createElement('style');
    this._elements.style.textContent = `
      .card-content {
        width: 100px;

        display: flex;
        flex-direction: column;
        align-items: center;

        --good-color: 0, 220, 0;
        --alright-color: 255, 133, 0;
        --bad-color: 255, 0, 0;
      }

      .destination {
        &.hidden {
          display: none;
        }
      }

      .logo {
        background-image: ${this.getBackgroundImageCss()};
        background-repeat: no-repeat;
        background-position: center;
        background-size: cover;
        width: 100%;
        height: 100px;
      }

      .current-time {
        padding: 2px 0;
        margin: 2px 0;

        align-self: stretch;
        text-align: center;

        border-radius: 6px;
        font-size: 17px;

        color: rgb(var(--time-color));
        background-color: rgba(var(--time-color), 0.3);
      }

      .time-good {
        --time-color: var(--good-color);

        .standard-time {
          display: none;
        }
      }

      .time-alright {
        --time-color: var(--alright-color);
      }

      .time-bad {
        --time-color: var(--bad-color);
      }
    `;
  }

  doUpdateHass() {
    /// Error checking, move this into its own method
    // Check for required attributes
    if (!this.getState().attributes.duration_in_traffic) {
      throw new Error('Sensor must have attribute: duration_in_traffic');
    }

    if (!this.getState().attributes.duration) {
      throw new Error('Sensor must have attribute: duration');
    }
    /// end error checking

    this._elements.standard_time.innerHTML = `
      Usually ${this.getStandardTravelTime()}
    `;

    this._elements.current_time.innerHTML = this.getCurrentTravelTime();

    this._elements.card_content.classList.remove('time-good');
    this._elements.card_content.classList.remove('time-alright');
    this._elements.card_content.classList.remove('time-bad');

    const extractNumber = /\d+/;
    const currentInt = Number(
      this.getCurrentTravelTime().match(extractNumber)[0]
    );
    const standardInt = Number(
      this.getStandardTravelTime().match(extractNumber)[0]
    );

    if (currentInt < standardInt) {
      this._elements.card_content.classList.add('time-good');
    } else if (currentInt - 5 < standardInt) {
      this._elements.card_content.classList.add('time-alright');
    } else {
      this._elements.card_content.classList.add('time-bad');
    }
  }

  doAttach() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(this._elements.style, this._elements.card);
  }

  getState() {
    return this._hass.states[this._config.entity];
  }

  getCurrentTravelTime() {
    return this.getState().attributes.duration_in_traffic;
  }

  getStandardTravelTime() {
    return this.getState().attributes.duration;
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: TravelTimeCard.SELECTOR,
  name: 'Travel Time Card',
  description:
    'Display the current travel time from the Google Maps Travel Time service.',
});

customElements.define(TravelTimeCard.SELECTOR, TravelTimeCard);
