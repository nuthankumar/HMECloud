/**
 * Using this file Manage the Group Hierachy level - stores and groups
 * Operation : Basic CURD App
 */

// config the model
let Sequelize = require('sequelize');
Sequelize = new Sequelize('hmeCloud', 'sa', 'nous@123', {
    host: 'NIBC1329',
    dialect: 'mssql',
    operatorsAliases: false
});
const group = require('../../Model/groupModel/Group')
const groupDetails = require('../../Model/groupModel/GroupStore')
// Config messages
const messages = require('../../common/message')



// get functions using accountid & name  - for the List

const list = (input, callback) => {
    const condition = {
        where: {
            AccountId: input.accountId,
            CreatedBy: input.createdBy
        }
    }
    group.findAll(condition)
        .then(result => {
            const output = {}
            if (result.length > 0) {
                output.data = result
                output.status = true
            } else {
                output.data = 'notfound'
                output.status = false
            }

            callback(output)
        }).catch(error => {
            const output = {
                data: error,
                status: false
            }
            callback(output)
        })
}

// create function

const create = (input, callback) => {
    const output = {}
    const condition = {
        where: {
            GroupName: input.name,
            AccountId: 100 // toDO: input.accountId update this //TODO: To be updated
        }
    }

    group.findAndCountAll(condition).then(count => {
        if (count.count === 0) {
            group.create({
                GroupName: input.name,
                Description: input.description,
                AccountId: 100, // input.accountId,  // TODO: To be updated
                CreatedBy: 'swathikumary@nousinfo.com', // TODO: To be updated
                UpdatedBy: 'swathikumary@nousinfo.com' // TODO: To be updated
            }).then(result => {
                if (input.groups.length > 0 || input.stores.length > 0) {
                    let maxSize = input.groups.length
                    for (var i = 0; i < maxSize; i++) {
                        group.update(
                            { ParentGroup: result.Id },
                            { returning: true, where: { id: (input.groups[i] !== undefined) ? input.groups[i] : null } }
                        )
                            .then(results1 => {

                            }).catch(error1 => {
                                output.data = error1
                                output.status = false

                                callback(output)
                            })
                    }
                    let maxSizes = input.stores.length
                    for (var j = 0; j < maxSizes; j++) {
                        groupDetails.create({
                            GroupId: result.Id,
                            StoreId: (input.stores[j] !== undefined) ? input.stores[j] : null
                        }).then(result1 => {

                        }).catch(error1 => {
                            output.data = error1
                            output.status = false

                            callback(output)
                        })
                    }
                }
                output.data = messages.CREATEGROUP.groupSuccess1 + input.name + messages.CREATEGROUP.groupSuccess2
                output.status = true
                output.result = result.Id
                callback(output)
            }).catch(error => {
                output.data = error
                output.status = false

                callback(output)
            })
        } else {
            output.data = input.name + messages.CREATEGROUP.groupAlreadyExist
            output.status = false

            callback(output)
        }
    }).catch(error1 => {
        output.data = error1
        output.status = false

        callback(output)
    })
}

const update = (input, callback) => {
    const output = {}
    const condition = {
        where: {
            Id: input.id,
            AccountId: 100 // toDO: input.accountId update this //TODO: To be updated
        }
    }
    group.findOne(condition).then(data => {
        if (data) {
            if (data.GroupName !== input.name) {
                const condition = {
                    where: {
                        GroupName: input.name,
                        AccountId: 100 // toDO: input.accountId update this //TODO: To be updated
                    }
                }
                group.findAndCountAll(condition).then(count => {
                    if (count.count > 0) {
                        output.data = input.name + messages.CREATEGROUP.groupAlreadyExist
                        output.status = false
                        callback(output)
                    } else {
                        updateGroupData(input, (response) => {
                            if (response.status === true) {
                                output.data = response.data
                                output.status = response.status

                                callback(output)
                            } else {
                                output.data = response.error
                                output.status = response.status

                                callback(output)
                            }
                        })
                    }
                }).catch(error4 => {
                    output.data = error4
                    output.status = false

                    callback(output)
                })
            } else {
                updateGroupData(input, (response) => {
                    if (response.status === true) {
                        output.data = response.data
                        output.status = response.status
                        callback(output)
                    } else {
                        output.data = response.error
                        output.status = response.status
                        callback(output)
                    }
                })
            }
        } else {
            // No data found for given group Id
            output.data = messages.CREATEGROUP.noDataForGivenId + input.id
            output.status = true
            callback(output)
        }
    }).catch(error => {
        output.data = error
        output.status = false

        callback(output)
    })
};

const updateGroupData = (input, callback) => {
    console.log('Update group invoked********')
    const output = {}
    group.update({
        GroupName: input.name,
        Description: input.description,
        UpdatedBy: 'jaffer@nousinfo.com', // TODO: To be updated
        UpdatedDateTime: Date().now
    }, {
            where: {
                Id: input.id
            }
        }).then(result1 => {
            console.log('the result printed=====****' + result1)
            console.log('check the code itself', result1)
            const condition = {
                where: {
                    GroupId: input.id
                }
            }
            groupDetails.destroy(condition).then(result2 => {
                console.log('The records deleted')
                if (input.groups.length > 0 || input.stores.length > 0) {
                    let maxSize = input.groups.length
                    for (var i = 0; i < maxSize; i++) {
                        group.update(
                            { ParentGroup: null },
                            { returning: true, where: { ParentGroup: (input.id) } }
                        )
                            .then(results1 => {

                            }).catch(error1 => {
                                output.data = error1
                                output.status = false

                                callback(output)
                            })
                        group.update(
                            { ParentGroup: input.id },
                            { returning: true, where: { Id: (input.groups[i]) } }
                        )
                            .then(results1 => {

                            }).catch(error1 => {
                                output.data = error1
                                output.status = false

                                callback(output)
                            })
                    }

                    let maxSizes = input.stores.length
                    for (var j = 0; j < maxSizes; j++) {
                        groupDetails.create({
                            GroupId: input.id,
                            StoreId: input.stores[j]
                        }).then(result1 => {

                        }).catch(error1 => {
                            output.data = error1
                            output.status = false

                            callback(output)
                        })
                    }
                }
                output.data = messages.CREATEGROUP.groupSuccess1 + input.name + messages.CREATEGROUP.groupUpdatesSuccess
                output.status = true
                callback(output)
            }).catch(error2 => {
                output.data = error2
                output.status = false

                callback(output)
            })
        }).catch(error1 => {
            output.data = error1
            output.status = false

            callback(output)
        })
}

const getgroupDetails = (input, callback) => {
    let output = {};

    const condition = {
        where: {
            Id: input.groupId,
            CreatedBy: input.userName
        }
    }
    group.findOne(condition).then(result => {
        if (result) {

            // Getting the child Group and Store details
            const Query = "SELECT g.Id, g.GroupName,'group' AS type FROM [dbo].[Group] as g where g.ParentGroup =" + input.groupId + " and g.CreatedBy='" + input.userName + "' union select s.Id, s.StoreName, 'store' AS type from Stores as s INNER JOIN GroupStore gd on s.Id = gd.StoreId INNER JOIN[dbo].[Group] as g on g.Id = gd.GroupId where gd.GroupId = " + input.groupId + " and g.CreatedBy ='" + input.userName + "'"
            Sequelize.query(Query, { type: Sequelize.QueryTypes.SELECT }).then(result1 => {
                if (result1) {
                    output.data = ({ group: result, details: result1 });
                    output.status = true;

                    callback(output)
                }

            }).catch(error1 => {
                output.data = error,
                    output.status = false

                callback(output)
            });

        } else {
            output.data = 'Data not found'
            output.status = false
            callback(output)
        }



    }).catch(error => {

        output.data = error,
            output.status = false

        callback(output)
    });
};

/*
Deletes Group and its sub groups from table
@param   inputs [groupId and accountId ]
@param callBack
*/
const deleteGroupById = (input, callBack) => {
    const updateParentGroup = {
        ParentGroup: null
    };

    groupDetails
        .update(updateParentGroup, {
            where: { ParentGroup: input.groupId }
        }).then(updatedRows => {
           group
                .destroy({
                    where: {
                        AccountId: input.accountId,
                        Id: input.groupId
                    }
                })
                .then((result) => {

                    const output = {
                        data: result,
                        status: true
                    };
                    return callBack(output);
                })
                .catch((error) => {
                    const output = {
                        data: error,
                        status: false
                    };
                    return callBack(output);
                });
        });



};

const avaliabledGroups = (input,callback)=>{

    const Query = "SELECT DISTINCT(g.Id), g.GroupName,'group' AS type FROM [dbo].[Group] as g where g.ParentGroup is null and g.AccountId = " + input.accountId + " and g.CreatedBy='" + input.createdBy + "' union select distinct s.Id, s.StoreName, 'store' AS type from Stores as s, GroupStore AS gd WHERE s.Id NOT IN(SELECT StoreId FROM GroupStore WHERE StoreId IS NOT NULL) and s.AccountId =" + input.accountId + " and s.CreatedBy='" + input.createdBy + "'";
    Sequelize.query(Query, { type: Sequelize.QueryTypes.SELECT}).then(result => {
     const output = {}
     if (result.length >0) {
         output.data = result
         output.status = true
     }else{
         output.data = 'notfound'
         output.status = false
     }
     callback(output)
 }).catch(error => {
     const output = {
         data: error,
         status: false
     }
     callback(output)
 })

}

const listGroupHierarchy = (input, callback) => {
    console.log("the controller invoked" + input.AccountId);
    const Query =
        "exec [dbo].[GetGroupHierarchy]  @Account_Id=" + input.AccountId;

    Sequelize.query(Query, { type: Sequelize.QueryTypes.SELECT }).then(result => {
        console.log("The results===" + JSON.stringify(result));
        const output = {}
        if (result.length > 0) {
            output.data = result
            output.status = true
        } else {
            output.data = 'notfound'
            output.status = false
        }
        callback(output)
    }).catch(error => {
        const output = {
            data: error,
            status: false
        }
        callback(output)
    });
}

module.exports = {
    list,
    create,
    getgroupDetails,
    deleteGroupById,
    update,
    avaliabledGroups,
    listGroupHierarchy
}