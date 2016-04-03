const multivarka = require('./multivarka');

/**
 * �������� ����������
 * @returns {Collection|MultivarkaConnection|*}
 * @private
 */
 var connection;
function __getMultivarka() {
    connection = connection || multivarka
        .server('mongodb://localhost/testdb')
        .collection('webdev2');

    return connection;
}

/**
 * ������ ������� find
 * @private
 */
function _runFindOperation() {
    __getMultivarka()
        .find(function (err, data) {
            console.log('show all ok');
            console.log(err || data);
        });
}

/**
 * ������ find � equal
 * @private
 */
function _runEqualOperation() {
    __getMultivarka()
        .where('name')
        .equal('Petya')
        .find(function (err, data) {
            console.log('equal ok');
            console.log(err || data);
        });
}

/**
 * ������ find � lessThan
 * @private
 */
function _runLessThanOperation() {
    __getMultivarka()
        .where('grade')
        .lessThan(5)
        .find(function (err, data) {
            console.log('less than ok');
            console.log(err || data);
        });
}

/**
 * ������ find � greatThan
 * @private
 */
function _runGreatThanOperation() {
    __getMultivarka()
        .where('grade')
        .greatThan(4)
        .find(function (err, data) {
            console.log('great than ok');
            console.log(err || data);
        });
}

/**
 * ������ find � include
 * @private
 */
function include() {
    __getMultivarka()
        .where('group')
        .include(['KB', 'KN'])
        .find(function (err, data) {
            console.log('include ok');
            console.log(err || data);
        });
}

/**
 * ������ find � not equal
 * @private
 */
function _runNotOperation() {
    __getMultivarka()
        .where('name')
        .not()
        .equal('Vasya')
        .find(function (err, data) {
            console.log('not is ok');
            console.log(err || data);
        });
}

/**
 * ������ update
 * @private
 */
function _runUpdateOperation() {
    __getMultivarka()
        .where('name')
        .equal('Vasya')
        .set('group', 'FIIT')
        .update(function (err, data) {
            console.log('update is ok');
            console.log(err || data);
        });
}


/**
 * ������ ����
 */
function flushData() {
    __getMultivarka()
        .remove(function (err, data) {
            console.log('remove ok');
            err && console.log(err);
        });
}

/**
 * �������������� ������
 */
function prepareData() {
    var students = [
        {name: 'Petya', group: 'KB', grade: 5},
        {name: 'Vasya', group: 'KN', grade: 5},
        {name: 'Kolya', group: 'KB', grade: 4},
        {name: 'Tanya', group: 'KN', grade: 4},
        {name: 'Vitya', group: 'PI', grade: 3}
    ];

    __getMultivarka().insert(students, function (err, data) {
        console.log('insert first ok');
        console.log(err || data);
    });
}

/**
 * ��������� �������� �� ����������
 */
function runOperations() {
    _runFindOperation();
    _runEqualOperation();
    _runLessThanOperation();
    _runGreatThanOperation();
    _runNotOperation();
    _runUpdateOperation();
}

(function() {
    flushData();
    prepareData();
    runOperations();
})();
