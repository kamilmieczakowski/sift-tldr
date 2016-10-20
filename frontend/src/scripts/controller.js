/**
 * Counter Sift. Frontend controller entry point.
 */
import { SiftController, registerSiftController } from '@redsift/sift-sdk-web';
import Webhook from './lib/webhook';

export default class MyController extends SiftController {
  constructor() {
    // You have to call the super() method to initialize the base class.
    super();
    this._suHandler = this.onStorageUpdate.bind(this);
    this.view.subscribe('wpm', this.onWPMChange.bind(this));
  }

  // for more info: https://docs.redsift.com/docs/client-code-siftcontroller
  loadView(state) {
    console.log('counter: loadView', state);
    // Register for storage update events on the "x" bucket so we can update the UI
    this.storage.subscribe(['count'], this._suHandler);
    switch (state.type) {
      case 'email-thread':
        return {
          html: 'email-thread.html',
          data: {}
        };
      case 'summary':
        return {
          html: 'summary.html',
          data: this.getCount()
        };
      default:
        console.error('counter: unknown Sift type: ', state.type);
    }
  }

  // Event: storage update
  onStorageUpdate(value) {
    console.log('counter: onStorageUpdate: ', value);
    return this.getCount().then(ce => {
      // Publish events from 'count' to view
      this.publish('counts', ce);
    });
  }

   getCount() {
    return Promise.resolve('la')
    // this.storage.get({
    //   bucket: 'count',
    //   keys: ['word_count']
    // }).then((values) => {
    //   console.log('counter: getCount returned:', values);
    //   return values[0];
    // });
  }

  onWPMChange(value) {
    console.log('sift-tldr: onWPMChange: ', value);
    this.storage.get({ bucket: '_redsift', keys: ['webhooks/slider-wh'] }).then((result) => {
      console.log('sift-tldr: onWPMChange webhook url: ', result[0].value);
      this._currency = value;
      this.storage.putUser({ kvs: [{ key: 'wpm', value: value }] });
      var wh = new Webhook(result[0].value);
      wh.send('wpm', value);
    }).catch((error) => {
      console.error('sift-tldr: onWPMChange: ', error);
    });
  }

}

// Do not remove. The Sift is responsible for registering its views and controllers
registerSiftController(new MyController());
