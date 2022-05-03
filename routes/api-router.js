const express = require("express");

let router = express.Router();

router.use("/messages", require("./messages-router"));
router.use("/guilds", require("./guilds-router"));
router.use("/channels", require("./channels-router"));
router.use("/users", require("./users-router"));
router.use("/attachments", require("./attachments-router"));
router.use("/control", require("./control-router"));
router.use("/stickers", require("./stickers-router"));
router.use("/emojis", require("./emojis-router"));
router.use("/roles", require("./roles-router"));

module.exports = router;