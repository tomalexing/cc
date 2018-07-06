/**
 * Represents an entry in the model.
 */
export default class ModelEntry {
    /**
     * Constructor for ModelEntry.
     * @param {string} name The unique name used for binding to this entry.
     * @param {*} value The initial value to assign
     * @param {[function(value)]} listeners The initial set of listeners to add.
     */
    constructor(name = null, value = null, listeners = []) {
      this._name = name;
      this._value = value;
      this._listeners = listeners;
      this._bound =
          this._name ? document.querySelectorAll(`[data-cc-bind='${name}']`) : [];
    }
    
    /**
     * Getter for the value of the entry.
     * @return {*} The value.
     */
    get value() {
      return this._value;
    }
  
    /**
     * Setter for the value of the entry.
     * @param {*} val The value.
     */
    set value(val) { 
      this._value = val;
      
      for (const listener of this._listeners) {
        listener(this._value);
      }
  
      for (let i = 0; i < this._bound.length; i++) {
        this._bound[i].textContent = this._value;
      }
    }

    /**
     * Setter for the link of the entry.
     * @param {*} val The value.
     */
    set link(val) {
      this._value = val;
  
      for (const listener of this._listeners) {
        listener(this._value);
      }
  
      for (let i = 0; i < this._bound.length; i++) {
        this._bound[i].textContent = this._value;
        this._bound[i].setAttribute('href',this._value);
      }
    }
    /**
     * Setter for the innerHTML of the entry.
     * @param {*} val The value.
     */
    set innerHTML(val) {
      this._value = val;
  
      for (const listener of this._listeners) {
        listener(this._value);
      }
  
      for (let i = 0; i < this._bound.length; i++) {
        this._bound[i].innerHTML = '';
        this._bound[i].insertAdjacentHTML('afterbegin', this._value);
      }
    }

    /**
     * Setter for the link of the entry.
     * @param {*} val The value.
     */
    set linkOnly(val) {
      this._value = val;
  
      for (const listener of this._listeners) {
        listener(this._value);
      }
  
      for (let i = 0; i < this._bound.length; i++) {
        this._bound[i].setAttribute('href',this._value);
      }
    }
  
    /** 
     * Attach a listener to this entry, to be notified of changes.
     * @param {function(val)} listener The listening function to attach.
     */
    listen(listener) {
      this._listeners.push(listener);
    }

  
    /**
     * Detach a listener from this entry.
     * @param {function(val)} listener The listening function to detach.
     */
    unlisten(listener) {
      const index = this._listeners.indexOf(listener);
      if (index > -1) {
        this._listeners.splice(index, 1);
      }
    }
  }