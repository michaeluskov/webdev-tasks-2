const multivarka = require('./multivarka');

function getMultivarka() {
    return multivarka
        .server('mongodb://localhost/testdb')
        .collection('webdev2');
}

function insertFirst() {
    var doc = {
        name: 'Vasya',
        grade: 5,
        group: 'KB'
    };
    getMultivarka()
    .insert(doc, function (err, data) {
        console.log('insert first ok');
        err ? console.log(err) : insertSecond();
    }); 
}

function insertSecond() {
    var doc = {
        name: 'Petya',
        grade: 5,
        group: 'KN'
    };
    getMultivarka()
    .insert(doc, function (err, data) {
        console.log('insert second ok');
        err ? console.log(err) : insertThird();
    }); 
}

function insertThird() {
    var doc = {
        name: 'Kolya',
        grade: 4,
        group: 'KN'
    };
    getMultivarka()
    .insert(doc, function (err, data) {
        console.log('insert third ok');
        err ? console.log(err) : showAll();
    }); 
}

function showAll() {
    getMultivarka()
    .find(function (err, data) {
        console.log('show all ok');
        err ? console.log(err) : (console.log(data) || equal());
    });
}

function equal() {
    getMultivarka()
    .where('name')
    .equal('Vasya')
    .find(function (err, data) {
        console.log('equal ok');
        err ? console.log(err) : (console.log(data) || lessThan());
    });
}

function lessThan() {
    getMultivarka()
    .where('grade')
    .lessThan(5)
    .find(function (err, data) {
        console.log('less than ok');
        err ? console.log(err) : (console.log(data) || greatThan());
    });
}

function greatThan() {
    getMultivarka()
    .where('grade')
    .greatThan(4)
    .find(function (err, data) {
        console.log('great than ok');
        err ? console.log(err) : (console.log(data) || include());
    });
}

function include() {
    getMultivarka()
    .where('group')
    .include(['KN', 'FIIT'])
    .find(function (err, data) {
        console.log('include ok');
        err ? console.log(err) : (console.log(data) || not());
    });
}

function not() {
    getMultivarka()
    .where('name')
    .not()
    .equal('Vasya')
    .find(function (err, data) {
        console.log('not is ok');
        err ? console.log(err) : (console.log(data) || update());
    });
}

function update() {
    getMultivarka()
    .where('name')
    .equal('Vasya')
    .set('group', 'FIIT')
    .update(function (err, data) {
        console.log('update is ok');
        err ? console.log(err) : (console.log(data) || showAfterUpdate());
    });
}

function showAfterUpdate() {
    getMultivarka()
    .where('group')
    .equal('FIIT')
    .find(function (err, data) {
        console.log('show after update is ok');
        err ? console.log(err) : (console.log(data) || console.log('OK'));
    });
}

getMultivarka()
.remove(function (err, data) {
    console.log('remove ok');
    err ? console.log(err) : insertFirst();
});