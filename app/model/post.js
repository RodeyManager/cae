'use strict';

module.exports = ({
  app,
  Model,
  DataTypes
}) => {

  const PostSchema = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.CHAR
    },
    content: {
      type: DataTypes.CHAR
    },
    uid: {
      type: DataTypes.INTEGER
    },
  };

  return Model.define('post', PostSchema, {
    freezeTableName: true,
    tableName: 'post',
  });
};
