# node-checkpoints
Node module for accumulating events and running scripts accordingly.

# Installation
```
npm install node-checkpoints
```

# Usage

```js
  var checkpoints = new Checkpoints(callback, 2000);
  checkpoints.addEvents(['event1', 'event2']);
  checkpoints.addAssets('http://www.domain.tld/some/image.jpg');
  checkpoints.execute();
  checkpoints.markComplete('event1');
  checkpoints.markComplete('event2');
  // image.jpg finished loading meanwhile
  // -> callback is triggered.
```

# Tests
```
npm test
```
