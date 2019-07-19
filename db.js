let users = [{
    id: 1,
    oid: 21,
    username: 'Jeremy',
    email: 'jeremy1.andrey@epitech.eu'
}, {
    id: 2,
    oid: 42,
    username: 'Chmouel',
    email: 'samuel1.berthe@epitech.eu'
}];

const findById = (id) => {
    return new Promise((resolve, reject) => {
        process.nextTick(function () {
            for (let i = 0; i < users.length; i++)
                if (users[i].id === id)
                    return resolve(users[i]);
            reject(new Error('User ' + id + ' does not exist'));
        });
    });
}

const findByOid = (oid) => {
    return new Promise((resolve, reject) => {
        process.nextTick(function () {
            for (let i = 0; i < users.length; i++)
                if (users[i].oid === oid)
                    return resolve(users[i]);
            reject(new Error('User ' + oid + ' does not exist'));
        });
    });
}

const findOrCreate = (oid, username, email) => {
    return findByOid(oid)
        .catch((err) => {
            const user = {
                id: Math.round(Math.random() * 4242),
                oid: oid,
                username: username,
                email: email,
            };
            users.push(user);
            return user;
        });
}

exports.findById = findById;
exports.findByOid = findByOid;
exports.findOrCreate = findOrCreate;