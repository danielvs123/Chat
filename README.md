- info

  - Based on Socket.io
  - Demo is available at  `https://shuaiyixu.xyz/`

- how to use

  - `vi config.js`

  - `npm install body-parse`

  - `node index.js`

  - perpare the mysql database

    ````
    CREATE TABLE `privateChat` (
      `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
      `fromId` varchar(20) NOT NULL DEFAULT '',
      `toId` varchar(20) NOT NULL DEFAULT '',
      `msg` text NOT NULL,
      `status` tinyint(1) NOT NULL DEFAULT '0',
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;
    ````

- run

  - `node index.js`
  - avaliable at `127.0.0.1:3000`
