import { Sequelize, DataTypes, Model } from 'sequelize';

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './data/database.sqlite',
  logging: true,
  pool: {
    max: 100,
    min: 5,
    acquire: 1000,
    idle: 10
  }
});


class TokenCalls extends Model {
};
class ChannelLogs extends Model {
   
};


class UpdateLogs extends Model {

}


UpdateLogs.init({
  // Model attributes are defined here
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  lastMessageId: {
    type: DataTypes.INTEGER,
    unique: true,
    allowNull: false
  },
  tokenAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
},
  {
    tableName: 'UpdateLogs',
    sequelize,
  });

class Channels extends Model {

};




TokenCalls.init({
  // Model attributes are defined here
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  }, 
  tokenAddress: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
  },
  tokenSymbol: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tokenName: {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
  dexUpdated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: true,
  },
  lpBurned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: true,
  },
  safeguarded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: true,
  },
  solTrending: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: true,
  },
},
  {
    tableName: 'TokenCalls',
    sequelize,
  });

  ChannelLogs.init({
    // Model attributes are defined here
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    callerPostId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    callerTG: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    channelName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    callTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    tokenAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    }, 
    priceChange24: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
      allowNull: true,
    },
    tokenMC: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      allowNull: true,
    }, 
  },
    {
      tableName: 'ChannelLogs',
      sequelize,
    });

Channels.init({
  // Model attributes are defined here
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  channelId: {
    type: DataTypes.INTEGER,
    unique: true,
    allowNull: false
  },
  channelName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  channelTitle: {
    type: DataTypes.STRING,
    allowNull: true
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: true,
  },
  isAlpha: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: true,
  },
},
  {
    tableName: 'Channels',
    sequelize,
  });



export { TokenCalls, ChannelLogs,Channels, UpdateLogs };