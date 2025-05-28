# ─── Standard Library ─────────────────────────────
import os
import json
import random
import string
import logging
from datetime import datetime, timedelta

# ─── Third-Party Libraries ────────────────────────
from dotenv import load_dotenv

# ─── Telegram Bot API ─────────────────────────────
from telegram import Update, InlineKeyboardMarkup, InlineKeyboardButton
from telegram.constants import ParseMode

from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    CallbackQueryHandler,
    MessageHandler,
    ContextTypes,
    filters,
)

# ─── Load environment variables ───────────────
load_dotenv()
TOKEN = os.getenv("TELEGRAM_TOKEN")

# ─── Enable logging (optional but helpful) ────
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

# ─── Command handler ──────────────────────────
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        text=(
            "🏠 <b>Menu Principal :</b>\n\n"
            "Choisissez une option ci-dessous :"
        ),
        parse_mode=ParseMode.HTML,
        reply_markup=main_menu()
    )


# ─── Build the application ────────────────────
app = ApplicationBuilder().token(TOKEN).build()
app.add_handler(CommandHandler("start", start))

# ─── Run with polling ─────────────────────────
if __name__ == "__main__":
    print("🤖 Bot is running...")
    app.run_polling()


def generate_discount_code():
    prefixes = ["ASU", "TEMPLE", "INITIÉ", "SAGESSE", "ÉCLAT", "LUMIÈRE", "HARMONIE", "ARCANE"]
    prefix = random.choice(prefixes)
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"{prefix}-{suffix}"

DISCOUNT_FILE = "remises.json"

def load_remises():
    if os.path.exists(DISCOUNT_FILE):
        with open(DISCOUNT_FILE, "r") as f:
            return json.load(f)
    return {}

def save_remises(data):
    with open(DISCOUNT_FILE, "w") as f:
        json.dump(data, f, indent=4)

logging.basicConfig(level=logging.INFO)

# To track which users are entering emails
user_states = {}

# Main button-based menu layout
def main_menu():
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("📘 Livres", callback_data="fr_Livres"),
            InlineKeyboardButton("🧘 Cours", callback_data="fr_Cours")
        ],
        [
            InlineKeyboardButton("🌐 Réseaux Sociaux", callback_data="fr_reseaux"),
            InlineKeyboardButton("🎤 Séminaires", callback_data="fr_Seminaires")
        ],
        [
            InlineKeyboardButton("❓ FAQ", callback_data="fr_FAQ"),
            InlineKeyboardButton("🎁 Rabais", callback_data="fr_Remise")
        ],
        [
            InlineKeyboardButton("📚 Ressources", callback_data="fr_ressources"),
            InlineKeyboardButton("👤 ETR Coaching", callback_data="fr_coaching")
        ],
        [
            InlineKeyboardButton("🙏 Faire un don", callback_data="fr_donation")
        ],
        [
            InlineKeyboardButton("💬 Parler à un humain", callback_data="fr_Agent")
        ]
    ])


def back_to_main_menu():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🏠 Retour au menu principal", callback_data="start_menu")]
    ])

def ressources_menu():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🎧 Audios", callback_data="ressources_audios")],
        [InlineKeyboardButton("📰 Articles", callback_data="ressources_articles")],
        [InlineKeyboardButton("📖 Biographie de Sabatha", callback_data="ressources_bio")],
        [InlineKeyboardButton("📘 Livres", callback_data="ressources_livres")],
        [InlineKeyboardButton("🎥 Vidéos", callback_data="ressources_videos")],
        [InlineKeyboardButton("📌 Références", callback_data="ressources_references")],
        [InlineKeyboardButton("🔙 Retour", callback_data="start_menu")]
    ])

def coaching_menu():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🔗 En savoir plus", url="https://www.notion.so/ERT-COACHING-1eb63fe03d3780cfbff2c4806d43b6a5?pvs=4")],
        [InlineKeyboardButton("⚪ Standard", callback_data="coaching_standard")],
        [InlineKeyboardButton("🟡 Intermédiaire", callback_data="coaching_intermediaire")],
        [InlineKeyboardButton("🔴 Avancé", callback_data="coaching_avance")],
        [InlineKeyboardButton("🔙 Retour", callback_data="start_menu")]
    ])


async def handle_ressources_audios(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(
        text=(
            "🎧 <b>Audios - Podcasts Mystiques</b>\n\n"
            "Écoutez les podcasts du Comte de Sabatha sur des sujets profonds tels que :\n"
            "• Le Vodou initiatique\n"
            "• La Franc-maçonnerie ésotérique\n"
            "• La Kabbale mystique\n"
            "• La théurgie et l’âme solaire\n\n"
            "🌐 <a href='https://t.me/+AhhmqZtBhQswNmJh'>Accéder aux podcasts sur Telegram</a>"
        ),
        parse_mode=ParseMode.HTML,
        reply_markup=back_to_main_menu()
    )


async def handle_ressources_articles(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(
        text=(
            "📰 <b>Articles Ésotériques</b>\n\n"
            "Découvrez une variété d’articles profonds et inspirants rédigés par le Comte de Sabatha. "
            "Ces textes explorent des thèmes comme l’alchimie spirituelle, la magie opérative, la franc-maçonnerie, "
            "le symbolisme et bien d'autres mystères sacrés.\n\n"
            "📚 <a href='https://sabatha.org/category/blog-2/'>Lire les articles sur sabatha.org</a>"
        ),
        parse_mode=ParseMode.HTML,
        reply_markup=back_to_main_menu()
    )

async def handle_ressources_bio(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(
        text=(
            "📖 <b>Biographie du Comte de Sabatha :</b>\n\n"
            "Initié dans plusieurs traditions ésotériques, le Comte de Sabatha est Maître en théurgie, adepte du rite de Memphis-Misraïm, "
            "et héritier d’une lignée opérative oubliée. Architecte symbolique et enseignant mystique, il transmet l’art sacré de la "
            "transmutation intérieure et la voie de l’âme solaire.\n\n"
            "🔗 <a href='https://orcid.org/0009-0008-4649-8808'>Voir la biographie complète sur ORCID</a>"
        ),
        parse_mode=ParseMode.HTML,
        reply_markup=back_to_main_menu()
    )

async def handle_ressources_videos(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(
        text=(
            "🎥 <b>Vidéo : Comment baptiser et nommer un nouveau-né</b>\n\n"
            "# <i>Et si le prénom de ton enfant était sa première prophétie ?</i>\n\n"
            "Un séminaire sacré pour choisir un prénom qui vibre avec l’âme de ton enfant.\n"
            "Une invitation à écouter, ressentir, nommer avec conscience.\n\n"
            "🕊️ <b>« Donner un nom, c'est appeler une âme à entrer dans une forme. C'est invoquer un destin. »</b>\n"
            "— Hazrat Inayat Khan, maître soufi et musicien mystique\n\n"
            "🔗 <a href='https://us02web.zoom.us/rec/share/xwra5bzoL2M5_N5hkOMDXMrWIhWkVfXUa2As932C9Qb7pjOZCQkY-UFIPhjhx1Xk.oQk2UTZCMVK7QuVf'>Voir la vidéo complète</a>"
        ),
        parse_mode=ParseMode.HTML,
        reply_markup=back_to_main_menu()
    )

async def handle_ressources_references(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(
        text=(
            "📌 <b>Programme de Références — ASU</b>\n\n"
            "💡 Partagez la lumière, recevez une bénédiction.\n\n"
            "Si vous recommandez l’Académie Sapience Universelle à une personne, et que celle-ci s’inscrit à une activité (cours, séminaire, classe…), "
            "vous recevrez un <b>code de réduction de 15%</b> valable sur toute activité de l’ASU.\n\n"
            "🌱 Une façon de remercier ceux qui font rayonner notre mission.\n\n"
            "📞 <b>Contactez la direction :</b>\n"
            "WhatsApp ou SMS au <b>+1 954 663 8783</b>\n\n"
            "📝 Merci d’envoyer :\n"
            "• Le <b>nom complet</b> de la personne que vous avez référée\n"
            "• L’<b>activité</b> (cours, séminaire, etc.) choisie\n"
            "• Votre <b>nom ou numéro</b> pour que l’on puisse vous identifier comme parrain\n\n"
            "✅ Une fois vérifié, vous recevrez votre <b>code promo personnel</b> par message."
        ),
        parse_mode=ParseMode.HTML,
        reply_markup=back_to_main_menu()
    )

async def handle_coaching_standard(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(
        text=(
            "⚪ <b>ETR Coaching – Niveau Standard</b>\n\n"
            "Un accompagnement spirituel personnalisé sur 3 semaines, pour explorer tes blocages, t’aligner avec ton chemin intérieur, "
            "et amorcer ta transformation.\n\n"
            "🌀 <b>Ce que tu reçois :</b>\n"
            "• Une semaine de préparation personnalisée\n"
            "• Analyse mystique + eso-psychologie\n"
            "• Identification de tes obstacles\n"
            "• Recommandations pratiques + ajustements comportementaux\n\n"
            "📲 Contacte la direction de l’ASU pour t’inscrire : +1 954 663 8783"
        ),
        parse_mode=ParseMode.HTML,
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("🔗 En savoir plus", url="https://www.notion.so/ERT-COACHING-1eb63fe03d3780cfbff2c4806d43b6a5?pvs=4")],
            [InlineKeyboardButton("🔙 Retour", callback_data="fr_coaching")]
        ])
    )


async def handle_coaching_intermediaire(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(
        text=(
            "🟡 <b>ETR Coaching – Niveau Intermédiaire</b>\n\n"
            "Un accompagnement de 6 semaines pour aller plus loin dans ta guérison intérieure, ton équilibre énergétique et ton recentrage spirituel.\n\n"
            "🔍 <b>Inclus :</b>\n"
            "• Bilan énergétique + lecture vibratoire\n"
            "• Outils d’alignement personnalisé (visualisations, purification, rituels simples)\n"
            "• Suivi hebdomadaire avec ajustements\n\n"
            "💠 Convient à ceux qui souhaitent transformer durablement leur hygiène émotionnelle et spirituelle.\n\n"
            "📲 Pour plus d'infos ou inscription : +1 954 663 8783"
        ),
        parse_mode=ParseMode.HTML,
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("🔗 En savoir plus", url="https://www.notion.so/ERT-COACHING-1eb63fe03d3780cfbff2c4806d43b6a5?pvs=4")],
            [InlineKeyboardButton("🔙 Retour", callback_data="fr_coaching")]
        ])
    )



async def handle_coaching_avance(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(
        text=(
            "🔴 <b>ETR Coaching – Niveau Avancé</b>\n\n"
            "Un parcours de 9 semaines conçu pour éveiller ta mémoire solaire, activer ton potentiel initiatique et intégrer ta mission sacrée.\n\n"
            "🜂 <b>Ce programme inclut :</b>\n"
            "• Travail de libération karmique\n"
            "• Activation des 3 corps (émotionnel, vibratoire, solaire)\n"
            "• Rituels alchimiques hebdomadaires\n"
            "• Guidance initiatique et transmissions mystiques\n\n"
            "🌞 Réservé aux chercheurs prêts à transcender leurs limites et à incarner leur feu intérieur.\n\n"
            "📲 Infos & inscriptions auprès de la direction : +1 954 663 8783"
        ),
        parse_mode=ParseMode.HTML,
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("🔗 En savoir plus", url="https://www.notion.so/ERT-COACHING-1eb63fe03d3780cfbff2c4806d43b6a5?pvs=4")],
            [InlineKeyboardButton("🔙 Retour", callback_data="fr_coaching")]
        ])
    )


async def handle_ressources_livres(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(
        text=(
            "📘 <b>Livre disponible :</b>\n\n"
            "🔹 <b>ASTRO-TAROLOGIE</b>\n"
            "<i>Symbolismes, méthodes et applications d’une discipline divinatoire contemporaine.</i>\n\n"
            "L'ouvrage <b>Astro-Tarologie</b> explore la fusion entre astrologie et tarot. Rédigé par les étudiants de l’Académie Sapience Universelle, "
            "il propose des bases théoriques solides, des méthodologies pratiques, et une réflexion sur les dimensions psychologiques et spirituelles "
            "de cette discipline.\n\n"
            "🔗 <a href='https://www.scribd.com/document/824409798/ASTRO-TAROLOGIE-Symbolisme-methodes-et-applications-d-une-discipline-divinatoire-contemporaine'>Lire le livre sur Scribd</a>"
        ),
        parse_mode=ParseMode.HTML,
        reply_markup=back_to_main_menu()
    )


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        text=(
            "👋 <b>Bienvenue chez Seshat Assistant !</b>\n\n"
            "Veuillez choisir une option ci-dessous pour commencer :"
        ),
        reply_markup=main_menu(),
        parse_mode=ParseMode.HTML
    )

import os
import json

DISCOUNT_FILE = "remises.json"

def load_remises():
    if os.path.exists(DISCOUNT_FILE):
        with open(DISCOUNT_FILE, "r") as f:
            return json.load(f)
    return {}

def save_remises(data):
    with open(DISCOUNT_FILE, "w") as f:
        json.dump(data, f, indent=4)

async def show_user_code(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    remises = load_remises()

    if user_id in remises:
        code = remises[user_id]["code"]
        expiration = remises[user_id]["expiration"]

        await update.message.reply_text(
            text=(
                "🔑 <b>Voici votre code de réduction :</b>\n\n"
                f"💸 <code>{code}</code>\n\n"
                f"📅 <i>Valable jusqu’au : {expiration}</i>"
            ),
            parse_mode=ParseMode.HTML
        )
    else:
        await update.message.reply_text(
            text=(
                "⚠️ <b>Vous n’avez pas encore généré de code promo.</b>\n\n"
                "Cliquez sur « 🎁 Rabais » dans le menu principal pour en recevoir un."
            ),
            parse_mode=ParseMode.HTML
        )

async def handle_fr_livres(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(
        text=(
            "📚 <b>Nos Livres :</b>\n\n"

            "📘 <b>La loi des cycles</b>\n"
            "<i>Exploration des lois universelles qui gouvernent les cycles de la vie.</i>\n"
            "🔗 <a href='https://a.co/d/a607uVz'>Voir sur Amazon</a>\n\n"

            "🌹 <b>Marie-Madeleine</b>\n"
            "<i>Relecture initiatique de la figure de Marie-Madeleine.</i>\n"
            "🔗 <a href='https://a.co/d/cIvOQfA'>Voir sur Amazon</a>\n\n"

            "🌒 <b>Vivre au-dessus du bien et du mal</b>\n"
            "<i>Invitation à dépasser la dualité morale pour accéder à une conscience supérieure et intégrative.</i>\n"
            "🔗 <a href='https://a.co/d/1aOQTEq'>Voir sur Amazon</a>\n\n"

            "🌀 <b>La domination des égrégores</b>\n"
            "<i>Étude sur la nature des égrégores, leur influence sur la psyché collective et la libération par le sacrifice du créateur déchu.</i>\n"
            "🔗 <a href='https://a.co/d/4l03hWg'>Voir sur Amazon</a>\n\n"

            "👁️ <b>La maladie des sens</b>\n"
            "<i>Parcours initiatique à travers la perception, l’illusion sensorielle et la quête de l’éveil spirituel.</i>\n"
            "🔗 <a href='https://a.co/d/1pMjZqB'>Voir sur Amazon</a>\n\n"

            "🔑 <b>Les secrets du Maître</b>\n"
            "<i>Méditation sur la mort, la victoire sur l’illusion de l’enfer et la transcendance spirituelle.</i>\n"
            "🔗 <a href='https://a.co/d/9B25dhz'>Voir sur Amazon</a>\n\n"

            "💫 <b>Du vodou colonial au vodou transcendantal</b>\n"
            "<i>Transformation spirituelle du vodou haïtien vers une pratique axée sur la sagesse, l’amour et la liberté.</i>\n"
            "🔗 <a href='https://a.co/d/eZQOeyR'>Voir sur Amazon</a>\n"
        ),
        parse_mode=ParseMode.HTML,
        reply_markup=back_to_main_menu()

    )

async def handle_fr_remise(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    user_id = str(query.from_user.id)
    remises = load_remises()

    # ✅ Vérifie s'il a déjà un code
    if user_id in remises:
        code = remises[user_id]["code"]
        expiration = remises[user_id]["expiration"]
    else:
        # ✅ Sinon, génère un nouveau code
        code = generate_discount_code()
        expiration = (datetime.now() + timedelta(days=30)).strftime("%d %B %Y")
        remises = load_remises()
        remises[user_id] = {"code": code, "expiration": expiration}
        save_remises(remises)


    # ✅ Affiche le message à l’utilisateur
    await query.edit_message_text(
        text=(
            "🎁 <b>Voici votre code de réduction :</b>\n\n"
            f"💸 <code>{code}</code>\n\n"
            "Utilisez ce code lors de votre paiement pour obtenir <b>-15%</b> sur votre prochaine inscription.\n\n"
            f"📅 <i>Valable jusqu’au : {expiration}</i>"
        ),
        parse_mode=ParseMode.HTML,
        reply_markup=back_to_main_menu()
    )

async def handle_fr_ressources(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(
        text="📚 <b>Ressources disponibles :</b>",
        parse_mode=ParseMode.HTML,
        reply_markup=ressources_menu()
    )

async def handle_fr_coaching(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(
        text="👤 <b>Coaching ETR : choisissez un niveau</b>",
        parse_mode=ParseMode.HTML,
        reply_markup=coaching_menu()
    )


async def handle_start_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(
        text="🏠 <b>Menu Principal :</b>\n\nChoisissez une option ci-dessous :",
        parse_mode=ParseMode.HTML,
        reply_markup=main_menu()

    )

async def handle_reseaux_sociaux(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(
        text=(
            "🌐 <b>Suivez-nous sur les réseaux sociaux :</b>\n\n"
            "🎵 TikTok : <a href='https://www.tiktok.com/@meta_huamain?_t=ZM-8wiGAdMgsuW&_r=1'>@meta_huamain</a>\n"
            "📸 Instagram : <a href='https://www.instagram.com/academie.sapience?igsh=bTZsYTBlZmJyZjZh'>@academie.sapience</a>\n"
            "📘 Facebook : <a href='https://www.facebook.com/profile.php?id=61575811124252'>Notre page Facebook</a>\n"
            "📢 Telegram : <a href='https://t.me/+owe0TtDXsyE0M2Qx'>Canal officiel</a>\n"
            "💬 WhatsApp : <a href='https://chat.whatsapp.com/JDHq6TS89cU0Sd5sjd248T'>Groupe WhatsApp</a>"
        ),
        parse_mode=ParseMode.HTML,
        reply_markup=back_to_main_menu()
    )

async def handle_donation(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(
        text=(
            "🙏 <b>Soutenir notre mission :</b>\n\n"
            "T-MEC et l’Académie Sapience Universelle accompagnent des milliers d’âmes vers la lumière, la connaissance, et la transformation intérieure.\n\n"
            "✨ Si notre travail vous inspire, vous pouvez contribuer à son rayonnement.\n"
            "🧡 Chaque don compte, quelle que soit la somme.\n\n"
            "🔗 <a href='https://www.notion.so/M-THODES-DE-PAIEMENT-1eb63fe03d3780baa43dcfcb8c0fa3f4?pvs=4'>Cliquez ici pour faire un don</a>"
        ),
        parse_mode=ParseMode.HTML,
        reply_markup=back_to_main_menu()
    )



async def handle_fr_cours(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(
        text=(
            "🧘 <b>COURS ÉSOTÉRIQUES PRÉENREGISTRÉS</b>\n\n"

            "📌 <b>ÉTAPES D’INSCRIPTION :</b>\n\n"
            "📝 <b>1.</b> Remplissez le formulaire unique d’inscription ci-dessous\n"
            "💳 <b>2.</b> Effectuez le paiement par carte, Zelle, Intuit ou autre méthode acceptée\n"
            "📞 <b>3.</b> Contactez le Comte de Sabatha via WhatsApp : <b>+1 954 663 8783</b>\n\n"
            "✅ Vous recevrez vos accès dans les 24h via Google Classroom\n\n"
            "🔗 <a href='https://form.jotform.com/243633811855157'>Formulaire d’inscription (toutes les classes)</a>\n\n"

            "🕯️ <b>Classe Maçonnique Alchimique et Théurgique</b>\n"
            "<i>Une voie rituelle et intérieure réservée aux véritables Maîtres — du Temple de pierre au Temple vivant.</i>\n\n"

            "🪽 <b>Classe de Magie Énochienne</b>\n"
            "<i>Un parcours guidé à travers la magie céleste et la communication avec les intelligences angéliques.</i>\n\n"

            "💎 <b>Classe L’Alchimie Sexuelle</b>\n"
            "<i>Formation sacrée pour libérer, activer et harmoniser l’énergie sexuelle — entre tantrisme et éveil intérieur.</i>\n\n"

            "🌌 <b>Classe Astro Tarot</b>\n"
            "<i>Décodage des messages de l’âme à travers les astres et la magie symbolique du Tarot.</i>"
        ),
        parse_mode=ParseMode.HTML,
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("💳 Voir les méthodes de paiement", url="https://www.notion.so/M-THODES-DE-PAIEMENT-1eb63fe03d3780baa43dcfcb8c0fa3f4?pvs=4")],
            [InlineKeyboardButton("🏠 Retour au menu principal", callback_data="start_menu")]
        ])
    )





async def handle_fr_videos(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(
        text=(
            "🎬 <b>Vidéos disponibles :</b>\n\n"
            "Accédez à notre bibliothèque de vidéos : cours enregistrés, replays de séminaires et formations spirituelles."
        ),
        parse_mode=ParseMode.HTML,
        reply_markup=back_to_main_menu()

    )

async def handle_fr_seminaires(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(
        text=(
            "🎤 <b>SÉMINAIRES ÉSOTÉRIQUES PRÉENREGISTRÉS</b>\n\n"

            "📌 <b>ÉTAPES D’INSCRIPTION :</b>\n\n"
            "📝 <b>1.</b> Remplissez le formulaire de préinscription ci-dessous\n"
            "💳 <b>2.</b> Effectuez le paiement par carte, Zelle, Intuit ou autre méthode acceptée\n"
            "📞 <b>3.</b> Contactez la direction pour confirmer votre accès\n\n"
            "✅ Vous recevrez vos accès dans les 24h via email\n\n"

            "🌀 <b>Séminaire : Création & Programmation des Égrégores</b>\n"
            "<i>Créez, entretenez et programmez des égrégores vivants selon les lois vibratoires de l'invisible.</i>\n"
            "📩 <b>RÉSERVATION :</b> Remplissez ce formulaire :\n"
            "🔗 <a href='https://form.jotform.com/251465347130149'>Formulaire d’inscription</a>\n"
            "💰 <b>Tarif :</b> 130 USD (ou 200 USD pour la série complète)\n\n"

            "🌫️ <b>Séminaire : Le Pouvoir Caché de l’Âme-Désincarnée</b>\n"
            "<i>Transformez une âme en esprit utile grâce à une guidance astrologique, ésotérique et vibratoire.</i>\n"
            "📩 <b>RÉSERVATION :</b> Remplissez ce formulaire :\n"
            "🔗 <a href='https://form.jotform.com/251465347130149'>Formulaire d’inscription</a>\n"
            "💰 <b>Tarif :</b> 120 USD\n\n"

            "📞 <b>Contact WhatsApp :</b> +1 954 663 8783\n"
            "📧 <b>Email :</b> info@academiesapienceuniverselle.org"
        ),
        parse_mode=ParseMode.HTML,
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("💳 Voir les méthodes de paiement", url="https://www.notion.so/M-THODES-DE-PAIEMENT-1eb63fe03d3780baa43dcfcb8c0fa3f4?pvs=4")],
            [InlineKeyboardButton("🏠 Retour au menu principal", callback_data="start_menu")]
        ])
    )


async def handle_fr_faq(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(
        text="❓ <b>FAQ — Choisissez une question :</b>",
        parse_mode=ParseMode.HTML,
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("📦 Accès aux cours", callback_data="faq_acces")],
            [InlineKeyboardButton("💳 Moyens de paiement", callback_data="faq_paiement")],
            [InlineKeyboardButton("📚 Plateformes utilisées", callback_data="faq_plateformes")],
            [InlineKeyboardButton("📅 Dates de début", callback_data="faq_dates")],
            [InlineKeyboardButton("🧑‍🏫 Accompagnement", callback_data="faq_accompagnement")],
            [InlineKeyboardButton("🌍 Élèves à l'étranger", callback_data="faq_international")],
            [InlineKeyboardButton("📞 Question personnelle", callback_data="faq_contact")],
            [InlineKeyboardButton("📦 Livraison des livres", callback_data="faq_livraison")],
            [InlineKeyboardButton("📝 Inscription aux cours", callback_data="faq_inscription")],
            [InlineKeyboardButton("🎥 Replays vidéos", callback_data="faq_videos")],
            [InlineKeyboardButton("🏠 Retour au menu principal", callback_data="start_menu")]
        ])
    )


async def handle_faq_acces(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.callback_query.answer()
    await update.callback_query.edit_message_text(
        text=(
            "📦 <b>Comment vais-je accéder à mes cours ou séminaires ?</b>\n\n"
            "<i>Via Google Classroom et en vidéos préenregistrées. Un lien d'accès vous sera envoyé après inscription.</i>"
        ),
        parse_mode=ParseMode.HTML,
        reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Retour au FAQ", callback_data="fr_FAQ")]])
    )

async def handle_faq_paiement(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.callback_query.answer()
    await update.callback_query.edit_message_text(
        text=(
            "💳 <b>Quels moyens de paiement acceptez-vous ?</b>\n\n"
            "<i>Zelle, Intuit (carte), CashApp, BUH Haïti, MoneyGram et Western Union. Les instructions vous seront envoyées après inscription.</i>"
        ),
        parse_mode=ParseMode.HTML,
        reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Retour au FAQ", callback_data="fr_FAQ")]])
    )

async def handle_faq_plateformes(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.callback_query.answer()
    await update.callback_query.edit_message_text(
        text=(
            "📚 <b>Quelles plateformes utilisez-vous ?</b>\n\n"
            "<i>Google Classroom pour les cours, Telegram pour l’accompagnement personnalisé.</i>"
        ),
        parse_mode=ParseMode.HTML,
        reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Retour au FAQ", callback_data="fr_FAQ")]])
    )

async def handle_faq_dates(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.callback_query.answer()
    await update.callback_query.edit_message_text(
        text=(
            "📆 <b>Quand commencent les cours ?</b>\n\n"
            "<i>Merci de contacter l’équipe pédagogique :\n📞 +1 954 663 8783\n📧 gpsabatha@gmail.com</i>"
        ),
        parse_mode=ParseMode.HTML,
        reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Retour au FAQ", callback_data="fr_FAQ")]])
    )

async def handle_faq_accompagnement(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.callback_query.answer()
    await update.callback_query.edit_message_text(
        text=(
            "👨‍🏫 <b>Y a-t-il un accompagnement ?</b>\n\n"
            "<i>Oui, via groupes Telegram privés et contact direct avec l’enseignant si besoin.</i>"
        ),
        parse_mode=ParseMode.HTML,
        reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Retour au FAQ", callback_data="fr_FAQ")]])
    )

async def handle_faq_international(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.callback_query.answer()
    await update.callback_query.edit_message_text(
        text=(
            "🌍 <b>Puis-je suivre les cours depuis l’étranger ?</b>\n\n"
            "<i>Oui, tous nos contenus sont 100 % en ligne et accessibles dans le monde entier.</i>"
        ),
        parse_mode=ParseMode.HTML,
        reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Retour au FAQ", callback_data="fr_FAQ")]])
    )

async def handle_faq_contact(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.callback_query.answer()
    await update.callback_query.edit_message_text(
        text=(
            "📞 <b>Comment poser une question personnelle ?</b>\n\n"
            "<i>Contactez-nous directement via WhatsApp :</i>\n"
            "<a href='https://wa.me/19546638783'>https://wa.me/19546638783</a>"
        ),
        parse_mode=ParseMode.HTML,
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("🔙 Retour au FAQ", callback_data="fr_FAQ")]
        ])
    )


async def handle_faq_livraison(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.callback_query.answer()
    await update.callback_query.edit_message_text(
        text=(
            "📦 <b>Comment se passe la livraison des livres ?</b>\n\n"
            "<i>Nos livres sont disponibles sur Amazon avec livraison mondiale.</i>"
        ),
        parse_mode=ParseMode.HTML,
        reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Retour au FAQ", callback_data="fr_FAQ")]])
    )

async def handle_faq_inscription(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.callback_query.answer()
    await update.callback_query.edit_message_text(
        text=(
            "📝 <b>Comment m’inscrire à un cours ?</b>\n\n"
            "<i>Inscrivez-vous directement via l’assistant SESHAT en suivant les liens dans chaque section de cours.</i>"
        ),
        parse_mode=ParseMode.HTML,
        reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Retour au FAQ", callback_data="fr_FAQ")]])
    )

async def handle_faq_videos(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.callback_query.answer()
    await update.callback_query.edit_message_text(
        text=(
            "🎥 <b>Combien de temps ai-je accès aux vidéos ?</b>\n\n"
            "<i>Les replays sont disponibles jusqu’à la fin officielle du programme ou formation concernée.</i>"
        ),
        parse_mode=ParseMode.HTML,
        reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Retour au FAQ", callback_data="fr_FAQ")]])
    )


async def handle_fr_agent(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(
        text=(
            "💬 <b>Contacter un conseiller humain – ASU</b>\n\n"
            "Besoin d’un accompagnement personnalisé ? D’une réponse rapide ?\n\n"
            "📞 <b>Appelez ou envoyez un message WhatsApp :</b>\n"
            "+1 954 663 8783\n\n"
            "📧 <b>Email :</b> gpsabatha@gmail.com\n\n"
            "⏰ Réponse sous 24h – du lundi au samedi\n"
            "🙏 Merci pour votre confiance dans l’Académie Sapience Universelle."
        ),
        parse_mode=ParseMode.HTML,
        reply_markup=back_to_main_menu()
    )


import re

user_states = {}

async def handle_fr_remise(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    user_id = str(query.from_user.id)
    user_states[user_id] = "awaiting_email"

    await query.edit_message_text(
        text="🎁 Pour recevoir votre code de réduction, veuillez entrer votre adresse email :",
        parse_mode=ParseMode.HTML
    )

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    message_text = update.message.text

    if user_states.get(user_id) == "awaiting_email":
        if re.match(r"[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+", message_text):
            user_states.pop(user_id)

            code = generate_discount_code()
            expiration = (datetime.now() + timedelta(days=30)).strftime("%d %B %Y")
            remises = load_remises()
            remises[user_id] = {"code": code, "expiration": expiration}
            save_remises(remises)

            await update.message.reply_text(
    f"✅ Merci ! Voici votre code de réduction :\n<code>{code}</code>\n\n"
    "🎓 Ce code vous donne <b>-15%</b> sur <b>tout cours préenregistré</b> de l’Académie Sapience Universelle.\n"
    f"📅 <i>Valable jusqu’au : {expiration}</i>",
    parse_mode=ParseMode.HTML,
    reply_markup=main_menu()
)

        else:
            await update.message.reply_text("❌ L'adresse email semble invalide. Veuillez réessayer.")
        return



from telegram.ext import ApplicationBuilder, CommandHandler, CallbackQueryHandler, MessageHandler, filters

app = ApplicationBuilder().token(TOKEN).build()


# ─── Handler Setup Function ───────────────────────
def setup_handlers(app):
    # Commands
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("code", show_user_code))
    app.add_handler(CommandHandler("faq", handle_fr_faq))

    # Menu navigation
    app.add_handler(CallbackQueryHandler(handle_start_menu, pattern="^start_menu$"))
    app.add_handler(CallbackQueryHandler(handle_fr_livres, pattern="^fr_Livres$"))
    app.add_handler(CallbackQueryHandler(handle_fr_cours, pattern="^fr_Cours$"))
    app.add_handler(CallbackQueryHandler(handle_fr_videos, pattern="^fr_Videos$"))
    app.add_handler(CallbackQueryHandler(handle_fr_seminaires, pattern="^fr_Seminaires$"))
    app.add_handler(CallbackQueryHandler(handle_fr_faq, pattern="^fr_FAQ$"))
    app.add_handler(CallbackQueryHandler(handle_fr_remise, pattern="^fr_Remise$"))
    app.add_handler(CallbackQueryHandler(handle_fr_agent, pattern="^fr_Agent$"))
    app.add_handler(CallbackQueryHandler(handle_fr_ressources, pattern="^fr_ressources$"))
    app.add_handler(CallbackQueryHandler(handle_fr_coaching, pattern="^fr_coaching$"))
    app.add_handler(CallbackQueryHandler(handle_reseaux_sociaux, pattern="^fr_reseaux$"))
    app.add_handler(CallbackQueryHandler(handle_donation, pattern="^fr_donation$"))

    # Submenus
    app.add_handler(CallbackQueryHandler(handle_ressources_audios, pattern="^ressources_audios$"))
    app.add_handler(CallbackQueryHandler(handle_ressources_articles, pattern="^ressources_articles$"))
    app.add_handler(CallbackQueryHandler(handle_ressources_bio, pattern="^ressources_bio$"))
    app.add_handler(CallbackQueryHandler(handle_ressources_livres, pattern="^ressources_livres$"))
    app.add_handler(CallbackQueryHandler(handle_ressources_videos, pattern="^ressources_videos$"))
    app.add_handler(CallbackQueryHandler(handle_ressources_references, pattern="^ressources_references$"))

    app.add_handler(CallbackQueryHandler(handle_coaching_standard, pattern="^coaching_standard$"))
    app.add_handler(CallbackQueryHandler(handle_coaching_intermediaire, pattern="^coaching_intermediaire$"))
    app.add_handler(CallbackQueryHandler(handle_coaching_avance, pattern="^coaching_avance$"))

    app.add_handler(CallbackQueryHandler(handle_faq_acces, pattern="^faq_acces$"))
    app.add_handler(CallbackQueryHandler(handle_faq_paiement, pattern="^faq_paiement$"))
    app.add_handler(CallbackQueryHandler(handle_faq_plateformes, pattern="^faq_plateformes$"))
    app.add_handler(CallbackQueryHandler(handle_faq_dates, pattern="^faq_dates$"))
    app.add_handler(CallbackQueryHandler(handle_faq_accompagnement, pattern="^faq_accompagnement$"))
    app.add_handler(CallbackQueryHandler(handle_faq_international, pattern="^faq_international$"))
    app.add_handler(CallbackQueryHandler(handle_faq_contact, pattern="^faq_contact$"))
    app.add_handler(CallbackQueryHandler(handle_faq_livraison, pattern="^faq_livraison$"))
    app.add_handler(CallbackQueryHandler(handle_faq_inscription, pattern="^faq_inscription$"))
    app.add_handler(CallbackQueryHandler(handle_faq_videos, pattern="^faq_videos$"))

    # Email entry
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

# ─── Entry Point for Render ───────────────────────
if __name__ == "__main__":
    load_dotenv()
    TOKEN = os.getenv("TELEGRAM_TOKEN")
    WEBHOOK_URL = os.getenv("WEBHOOK_URL")

    app = ApplicationBuilder().token(TOKEN).build()
    setup_handlers(app)

    app.run_webhook(
        listen="0.0.0.0",
        port=int(os.environ.get("PORT", 10000)),
        webhook_url=f"{WEBHOOK_URL}/webhook/{TOKEN}"
    )


