const { admin, db } = require('./firebaseConfig');

async function addMemberToDatabase(member) {
  const userRef = db.collection('users').doc(member.id);
  const doc = await userRef.get();
  if (!doc.exists) {
    await userRef.set({
      discordId: member.id,
      username: member.user.username,
      points: 0 
    });
    console.log(`Added ${member.user.username} to the database.`);
  } else {
    console.log(`${member.user.username} is already in the database.`);
  }
}

async function addAllMembers(client, guildId) {
  const guild = await client.guilds.fetch(guildId);
  const members = await guild.members.fetch();

  members.forEach(member => {
    if (!member.user.bot) {
      addMemberToDatabase(member);
    }
  });
}

function setupMemberJoinListener(client) {
  client.on('guildMemberAdd', member => {
    addMemberToDatabase(member);
  });
}
async function addPointsToUser(memberId, points) {
    const userRef = db.collection('users').doc(memberId);
    const doc = await userRef.get();
    if (!doc.exists) {
      console.log(`User ${memberId} not found in the database, adding with initial points.`);
      await userRef.set({
        discordId: memberId,
        username: "",
        points: points
      });
    } else {
      await userRef.update({
        points: admin.firestore.FieldValue.increment(points)
      });
    }
  }

  async function getUserBalance(memberId) {
    const userRef = db.collection('users').doc(memberId);
    const doc = await userRef.get();
    if (doc.exists) {
      return doc.data().points;
    } else {
      return 0;
    }
  }

  async function transferPoints(fromMemberId, toMemberId, points) {
    const fromUserRef = db.collection('users').doc(fromMemberId);
    const toUserRef = db.collection('users').doc(toMemberId);
  
    await db.runTransaction(async (transaction) => {
      const fromDoc = await transaction.get(fromUserRef);
      const toDoc = await transaction.get(toUserRef);
  
      if (!fromDoc.exists || fromDoc.data().points < points) {
        throw new Error('Insufficient points');
      }
  
      transaction.update(fromUserRef, { points: admin.firestore.FieldValue.increment(-points) });
      transaction.set(toUserRef, { points: admin.firestore.FieldValue.increment(points) }, { merge: true });
    });
  }

module.exports = { addAllMembers, setupMemberJoinListener, addMemberToDatabase, addPointsToUser, getUserBalance, transferPoints };