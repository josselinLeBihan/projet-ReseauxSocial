const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Token = require("../models/token.model");
const User = require("../models/user.model");
const LOG = console.log;

exports.signup = async (req, res) => {
  try {
    const { name, email, password, userName } = req.body;

    if (!name || !email || !password || !userName) {
      LOG("⚠️ Champs manquants !");
      return res.status(400).json({ error: "Tous les champs sont requis." });
    }

    if (await User.findOne({ userName })) {
      LOG("⚠️ Le user name existe déjà");
      return res
        .status(400)
        .json({ error: "Il existe déjà un compte avec ce nom d'utilisateur." });
    }

    if (await User.findOne({ email })) {
      LOG("⚠️ Le mail existe déjà");
      return res
        .status(400)
        .json({ error: "Il existe déjà un compte avec cette email." });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      userName,
      password: hash,
    });

    await user.save();
    res.status(201).json({ message: "Utilisateur créé !" });
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur :", error);
    res.status(500).json({ error: "Une erreur est survenue." });
  }
};

exports.signin = async (req, res) => {
  try {
    // Recherche de l'utilisateur par email
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      console.log("Utilisateur non trouvé avec l'email :", req.body.email); // Log si l'utilisateur n'existe pas
      return res
        .status(401)
        .json({ error: "Paire identifiant/mot de passe incorrecte !" });
    }

    console.log("Utilisateur trouvé :", user); // Log les informations de l'utilisateur trouvé (sans mot de passe)

    // Comparaison des mots de passe
    const valid = await bcrypt.compare(req.body.password, user.password);

    if (!valid) {
      console.log(
        "Échec de la comparaison des mots de passe pour l'utilisateur :",
        user.email
      ); // Log si le mot de passe est incorrect
      return res
        .status(401)
        .json({ error: "Paire identifiant/mot de passe incorrecte !" });
    }

    console.log("Mot de passe valide pour l'utilisateur :", user.email); // Log si le mot de passe est valide

    const payload = {
      id: user._id,
      email: user.email,
    };

    // Génération du token JWT
    const accessToken = jwt.sign(payload, process.env.SECRET, {
      expiresIn: "6h",
    });

    const refreshToken = jwt.sign(payload, process.env.REFRESH_SECRET, {
      expiresIn: "7d",
    });

    console.log("Token JWT généré pour l'utilisateur :", user.email); // Log du token généré (évitez de le loguer en production)

    // Réponse avec les informations de connexion
    res.status(200).json({
      accessToken: accessToken,
      refreshToken: refreshToken,
      accessTokenUpdatedAt: new Date().toLocaleString(),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        userName: user.userName,
      },
    });
    console.log("Utilisateur connecté avec succès :", user.email); // Log final pour confirmer la connexion
  } catch (error) {
    console.error("Erreur lors du processus de connexion :", error); // Log des erreurs inattendues
    res.status(500).json({ error: "Une erreur interne est survenue." });
  }
};

exports.logout = async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.split(" ")[1] ?? null;
    if (accessToken) {
      await Token.deleteOne({ accessToken });
    }
    res.status(200).json({
      message: "Déconnexion réussi.",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Une erreur interne est survenue.",
    });
  }
};
