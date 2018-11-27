'use strict';

module.exports = ({
  app,
  Model,
  DataTypes
}) => {

  const UserSchema = {
    'id': {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    'username': {
      type: DataTypes.CHAR,
    },
    'password': {
      type: DataTypes.CHAR,
    },
  };

  return Model.define('user', UserSchema);
};
