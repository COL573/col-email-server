import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as sgMail from "@sendgrid/mail";

admin.initializeApp();
sgMail.setApiKey(functions.config().sendgrid.key);
 // Replace with your real SendGrid API Key

// ✅ 1. Send Welcome Email to New Users (with Google Drive links)
export const sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
  const email = user.email;

  const msg = {
    to: email,
    from: "no-reply@colministries.org",
    subject: "Welcome to COL Ministries!",
    text: `Dear ${user.displayName || "New Member"},\n\nWelcome to the Children of Light (COL) Ministries family!\n\nWe’re excited to have you join us.\n\nChurch Program: https://drive.google.com/uc?export=download&id=YOUR_PDF_ID\nPoster: https://drive.google.com/uc?export=download&id=YOUR_POSTER_ID`,
    html: `<strong>Welcome to COL Ministries!</strong><br><br>
           We're excited to have you join us!<br>
           <p>📄 <a href="https://drive.google.com/uc?export=download&id=12W-pwhuEmkau3C38iMBqZC8p5eDpA3s1">View Church Program (PDF)</a></p>
           <p>🖼️ <a href="https://drive.google.com/uc?export=download&id=1qPE3qg3VsLKPcDW7sOIXQgSrjYVeg-67">View Church Poster</a></p>`
  };

  try {
    await sgMail.send(msg);
    console.log("✅ Welcome email sent to:", email);
  } catch (err) {
    console.error("❌ Failed to send welcome email:", err);
  }
});

// ✅ 2. Notify All Users When Event Is Updated
export const notifyEventUpdate = functions.firestore
  .document("events/{eventId}")
  .onUpdate(async (change, context) => {
    const newEvent = change.after.data();
    const oldEvent = change.before.data();

    if (newEvent.onlineLink !== oldEvent.onlineLink || newEvent.date !== oldEvent.date || newEvent.title !== oldEvent.title) {
      const usersSnapshot = await admin.firestore().collection("users").get();
      const emails: string[] = usersSnapshot.docs.map(doc => doc.data().email);

      const msg = {
        to: emails,
        from: "no-reply@colministries.org",
        subject: `Updated Event: ${newEvent.title}`,
        html: `<h3>Event Update</h3>
               <p><strong>Title:</strong> ${newEvent.title}</p>
               <p><strong>Description:</strong> ${newEvent.description}</p>
               <p><strong>Date:</strong> ${newEvent.date}</p>
               ${newEvent.onlineLink ? `<p><strong>Join Online:</strong> <a href="${newEvent.onlineLink}">${newEvent.onlineLink}</a></p>` : ""}`
      };

      try {
        await sgMail.send(msg);
        console.log("✅ Event update email sent to all users");
      } catch (err) {
        console.error("❌ Failed to send event update email:", err);
      }
    } else {
      console.log("No significant event changes detected. No emails sent.");
    }
  });
