var neo4j = require('neo4j-driver');

var driver = neo4j.driver(
  'bolt://localhost',
  neo4j.auth.basic('neo4j', 'NGA')
);

var session = driver.session();

console.log(">>>cons", session.constructor);

session
  .run('MERGE (alice:Person {name : $nameParam}) RETURN alice.name AS name', {
    nameParam: 'Alice'
  })
  .subscribe({
    onKeys: keys => {
      console.log(keys)
    },
    onNext: record => {
      console.log(record.get('name'))
    },
    onCompleted: () => {
      session.close() // returns a Promise
			driver.close()
    },
    onError: error => {
      console.log(error)
    }
  });

session.constructor.prototype.xxx = function () {}
