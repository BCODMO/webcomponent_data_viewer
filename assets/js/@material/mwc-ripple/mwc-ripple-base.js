import { __decorate } from "../../tslib/tslib.es6.js";
/**
@license
Copyright 2018 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { BaseElement } from "../mwc-base/base-element.js";
import MDCRippleFoundation from "../ripple/foundation.js";
import { html, internalProperty, property, query } from "../../lit-element/lit-element.js";
import { classMap } from "../../lit-html/directives/class-map.js";
import { styleMap } from "../../lit-html/directives/style-map.js";
/** @soyCompatible */

export class RippleBase extends BaseElement {
  constructor() {
    super(...arguments);
    this.primary = false;
    this.accent = false;
    this.unbounded = false;
    this.disabled = false;
    this.activated = false;
    this.selected = false;
    this.hovering = false;
    this.bgFocused = false;
    this.fgActivation = false;
    this.fgDeactivation = false;
    this.fgScale = '';
    this.fgSize = '';
    this.translateStart = '';
    this.translateEnd = '';
    this.leftPos = '';
    this.topPos = '';
    this.mdcFoundationClass = MDCRippleFoundation;
  }

  get isActive() {
    return (this.parentElement || this).matches(':active');
  }

  createAdapter() {
    return {
      browserSupportsCssVars: () => true,
      isUnbounded: () => this.unbounded,
      isSurfaceActive: () => this.isActive,
      isSurfaceDisabled: () => this.disabled,
      addClass: className => {
        switch (className) {
          case 'mdc-ripple-upgraded--background-focused':
            this.bgFocused = true;
            break;

          case 'mdc-ripple-upgraded--foreground-activation':
            this.fgActivation = true;
            break;

          case 'mdc-ripple-upgraded--foreground-deactivation':
            this.fgDeactivation = true;
            break;

          default:
            break;
        }
      },
      removeClass: className => {
        switch (className) {
          case 'mdc-ripple-upgraded--background-focused':
            this.bgFocused = false;
            break;

          case 'mdc-ripple-upgraded--foreground-activation':
            this.fgActivation = false;
            break;

          case 'mdc-ripple-upgraded--foreground-deactivation':
            this.fgDeactivation = false;
            break;

          default:
            break;
        }
      },
      containsEventTarget: () => true,
      registerInteractionHandler: () => undefined,
      deregisterInteractionHandler: () => undefined,
      registerDocumentInteractionHandler: () => undefined,
      deregisterDocumentInteractionHandler: () => undefined,
      registerResizeHandler: () => undefined,
      deregisterResizeHandler: () => undefined,
      updateCssVariable: (varName, value) => {
        switch (varName) {
          case '--mdc-ripple-fg-scale':
            this.fgScale = value;
            break;

          case '--mdc-ripple-fg-size':
            this.fgSize = value;
            break;

          case '--mdc-ripple-fg-translate-end':
            this.translateEnd = value;
            break;

          case '--mdc-ripple-fg-translate-start':
            this.translateStart = value;
            break;

          case '--mdc-ripple-left':
            this.leftPos = value;
            break;

          case '--mdc-ripple-top':
            this.topPos = value;
            break;

          default:
            break;
        }
      },
      computeBoundingRect: () => (this.parentElement || this).getBoundingClientRect(),
      getWindowPageOffset: () => ({
        x: window.pageXOffset,
        y: window.pageYOffset
      })
    };
  }

  startPress(ev) {
    this.waitForFoundation(() => {
      this.mdcFoundation.activate(ev);
    });
  }

  endPress() {
    this.waitForFoundation(() => {
      this.mdcFoundation.deactivate();
    });
  }

  startFocus() {
    this.waitForFoundation(() => {
      this.mdcFoundation.handleFocus();
    });
  }

  endFocus() {
    this.waitForFoundation(() => {
      this.mdcFoundation.handleBlur();
    });
  }

  startHover() {
    this.hovering = true;
  }

  endHover() {
    this.hovering = false;
  }
  /**
   * Wait for the MDCFoundation to be created by `firstUpdated`
   */


  waitForFoundation(fn) {
    if (this.mdcFoundation) {
      fn();
    } else {
      this.updateComplete.then(fn);
    }
  }
  /** @soyTemplate */


  render() {
    const shouldActivateInPrimary = this.activated && (this.primary || !this.accent);
    const shouldSelectInPrimary = this.selected && (this.primary || !this.accent);
    /** @classMap */

    const classes = {
      'mdc-ripple-surface--accent': this.accent,
      'mdc-ripple-surface--primary--activated': shouldActivateInPrimary,
      'mdc-ripple-surface--accent--activated': this.accent && this.activated,
      'mdc-ripple-surface--primary--selected': shouldSelectInPrimary,
      'mdc-ripple-surface--accent--selected': this.accent && this.selected,
      'mdc-ripple-surface--disabled': this.disabled,
      'mdc-ripple-surface--hover': this.hovering,
      'mdc-ripple-surface--primary': this.primary,
      'mdc-ripple-surface--selected': this.selected,
      'mdc-ripple-upgraded--background-focused': this.bgFocused,
      'mdc-ripple-upgraded--foreground-activation': this.fgActivation,
      'mdc-ripple-upgraded--foreground-deactivation': this.fgDeactivation,
      'mdc-ripple-upgraded--unbounded': this.unbounded
    };
    return html`
        <div class="mdc-ripple-surface mdc-ripple-upgraded ${classMap(classes)}"
          style="${styleMap({
      '--mdc-ripple-fg-scale': this.fgScale,
      '--mdc-ripple-fg-size': this.fgSize,
      '--mdc-ripple-fg-translate-end': this.translateEnd,
      '--mdc-ripple-fg-translate-start': this.translateStart,
      '--mdc-ripple-left': this.leftPos,
      '--mdc-ripple-top': this.topPos
    })}"></div>`;
  }

}

__decorate([query('.mdc-ripple-surface')], RippleBase.prototype, "mdcRoot", void 0);

__decorate([property({
  type: Boolean
})], RippleBase.prototype, "primary", void 0);

__decorate([property({
  type: Boolean
})], RippleBase.prototype, "accent", void 0);

__decorate([property({
  type: Boolean
})], RippleBase.prototype, "unbounded", void 0);

__decorate([property({
  type: Boolean
})], RippleBase.prototype, "disabled", void 0);

__decorate([property({
  type: Boolean
})], RippleBase.prototype, "activated", void 0);

__decorate([property({
  type: Boolean
})], RippleBase.prototype, "selected", void 0);

__decorate([internalProperty()], RippleBase.prototype, "hovering", void 0);

__decorate([internalProperty()], RippleBase.prototype, "bgFocused", void 0);

__decorate([internalProperty()], RippleBase.prototype, "fgActivation", void 0);

__decorate([internalProperty()], RippleBase.prototype, "fgDeactivation", void 0);

__decorate([internalProperty()], RippleBase.prototype, "fgScale", void 0);

__decorate([internalProperty()], RippleBase.prototype, "fgSize", void 0);

__decorate([internalProperty()], RippleBase.prototype, "translateStart", void 0);

__decorate([internalProperty()], RippleBase.prototype, "translateEnd", void 0);

__decorate([internalProperty()], RippleBase.prototype, "leftPos", void 0);

__decorate([internalProperty()], RippleBase.prototype, "topPos", void 0); //# sourceMappingURL=mwc-ripple-base.js.map