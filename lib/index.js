const AbstractClientStore = require("@codice-progressio/express-brute/lib/AbstractClientStore");
const moment = require("moment");

class MongooseStore extends AbstractClientStore {
  constructor(modelOrCallback, options) {
    super(modelOrCallback, options);
    this.options = { ...MongooseStore.defaults, ...options };
    // TODO: Is there a better way to tell something is a mongoose model?
    if (modelOrCallback.updateOne && modelOrCallback.findOne) {
      this.model = modelOrCallback;
    } else {
      modelOrCallback(model => {
        this.model = model;
      });
    }
  }

  set(key, value, lifetime, callback) {
    const id = this.options.prefix + key;
    const expires = lifetime
      ? moment()
          .add(lifetime, "seconds")
          .toDate()
      : undefined;

    const ret = this.model
      .updateOne(
        {
          _id: id
        },
        {
          data: value,
          expires
        },
        {
          upsert: true
        }
      )
      .exec();

    if (callback && typeof callback === "function") {
      ret.then(
        data => callback(null, data),
        err => callback(err, null)
      );
    }

    return ret;
  }

  get(key, callback) {
    const id = this.options.prefix + key;

    const ret = this.model
      .findOne({ _id: id })
      .exec()
      .then(doc => {
        if (doc && doc.expires < new Date()) {
          return this.model
            .deleteMany({ _id: id })
            .exec()
            .then(() => null);
        } else if (doc) {
          const { data } = doc;
          data.lastRequest = new Date(data.lastRequest);
          data.firstRequest = new Date(data.firstRequest);
          return Promise.resolve(data);
        }
        return Promise.resolve(null);
      });

    if (callback && typeof callback === "function") {
      ret.then(
        data => callback(null, data),
        err => callback(err, null)
      );
    }

    return ret;
  }

  reset(key, callback) {
    const id = this.options.prefix + key;

    const ret = this.model.deleteMany({ _id: id }).exec();

    if (callback && typeof callback === "function") {
      ret.then(
        data => callback(null, data),
        err => callback(err, null)
      );
    }

    return ret;
  }
}

MongooseStore.defaults = {
  prefix: ""
};

module.exports = MongooseStore;
