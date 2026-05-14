// routes/api.js

const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const usda = require("../services/usda");
const ifct = require("../services/ifct");
const imageClassifier = require("../services/imageClassifier");

const {
  mapToIFCT,
  isIndianFood
} = require("../services/indianAliases");

console.log("✅ imageClassifier module loaded");

/**
 * ============================================
 * FOOD IDENTIFICATION ROUTE
 * ============================================
 *
 * FINAL WORKFLOW:
 *
 * IMAGE
 *   ↓
 * GENERAL CLASSIFIER
 *   ↓
 * USDA SEARCH FIRST
 *   ↓
 * FOUND?
 *   YES → RETURN USDA
 *   NO
 *   ↓
 * IF LOOKS INDIAN
 *   ↓
 * SEARCH IFCT
 *   ↓
 * FOUND?
 *   YES → RETURN IFCT
 *   NO
 *   ↓
 * LOCAL FALLBACK / ERROR
 *
 * ============================================
 */

router.post(
  "/identify",
  upload.single("image"),
  async (req, res) => {

    try {

      const { name } = req.body;
      const imageFile = req.file;

      let guessedName =
        name && name.trim().length
          ? name.trim()
          : null;

      console.log("\n================================");
      console.log("🚀 /api/identify called");
      console.log("================================");

      console.log(
        "📝 Text provided:",
        guessedName ? guessedName : "NO"
      );

      console.log(
        "🖼️ Image provided:",
        imageFile ? "YES" : "NO"
      );

      /**
       * =====================================
       * STEP 1: IMAGE CLASSIFICATION
       * =====================================
       */

      if (!guessedName && imageFile) {

        console.log("🤖 Starting image classification...");

        const classification =
          await imageClassifier.classifyImage(
            imageFile.buffer
          );

        console.log(
          "🔍 Raw classification result:",
          classification
        );

        if (classification) {

          // Handle different classifier formats
          if (typeof classification === "string") {

            guessedName = classification;

          } else if (classification.label) {

            guessedName = classification.label;

          } else if (
            Array.isArray(classification) &&
            classification[0]?.label
          ) {

            guessedName = classification[0].label;
          }
        }

        // Clean final label
        if (guessedName) {

          guessedName = guessedName
            .toLowerCase()
            .trim();

          guessedName =
            imageClassifier.cleanFoodLabel(
              guessedName
            );

          console.log(
            `✅ Classified food: ${guessedName}`
          );

        } else {

          console.log(
            "❌ Could not classify image"
          );

          return res.status(400).json({
            error:
              "Could not identify food from image. Try uploading a clearer image or type the food name manually."
          });
        }
      }

      /**
       * =====================================
       * STEP 2: VALIDATION
       * =====================================
       */

      if (!guessedName) {

        console.log("❌ No food name available");

        return res.status(400).json({
          error:
            "No food name provided and image classification failed."
        });
      }

      /**
       * =====================================
       * STEP 3: NORMALIZE FOOD NAME
       * =====================================
       */

      const mappedName = mapToIFCT(guessedName);

      console.log(
        `🔍 Final search term: "${mappedName}"`
      );

      /**
       * =====================================
       * STEP 4: USDA SEARCH FIRST
       * =====================================
       *
       * IMPORTANT:
       * USDA is searched FIRST for ALL foods.
       *
       * This fixes:
       * Pizza → Biryani
       * Burger → Curry
       * Pasta → Dosa
       *
       * because non-Indian foods are already
       * present in USDA.
       *
       * =====================================
       */

      console.log("🇺🇸 Searching USDA database...");

      let usdaResult = null;

      try {

        usdaResult =
          await usda.searchFoodAndNutrients(
            mappedName
          );

      } catch (usdaErr) {

        console.error(
          "⚠️ USDA search failed:",
          usdaErr.message
        );
      }

      if (usdaResult) {

        console.log(
          `✅ USDA match found: ${usdaResult.description}`
        );

        return res.json({
          success: true,
          source: "USDA",
          matchName: usdaResult.description,
          classifiedAs: guessedName,
          nutrients: usdaResult.nutrients
        });
      }

      /**
       * =====================================
       * STEP 5: IF USDA FAILS
       * TRY INDIAN DATABASE
       * =====================================
       */

      console.log(
        "⚠️ USDA did not find food"
      );

      if (isIndianFood(mappedName)) {

        console.log(
          "🇮🇳 Food appears Indian"
        );

        console.log(
          "🇮🇳 Searching IFCT database..."
        );

        const ifctResult =
          ifct.findFood(mappedName);

        if (ifctResult) {

          console.log(
            `✅ IFCT match found: ${ifctResult.name}`
          );

          return res.json({
            success: true,
            source: "IFCT",
            matchName: ifctResult.name,
            classifiedAs: guessedName,
            nutrients: ifctResult.nutrients
          });
        }

        console.log(
          "⚠️ Not found in IFCT either"
        );
      }

      /**
       * =====================================
       * STEP 6: FINAL FALLBACK
       * =====================================
       */

      console.log(
        `❌ Food "${mappedName}" not found anywhere`
      );

      return res.status(404).json({
        success: false,
        error:
          `Food "${mappedName}" was not found in USDA or IFCT databases.`,
        classifiedAs: guessedName
      });

    } catch (err) {

      console.error(
        "❌ API ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        error:
          err.message ||
          "Internal server error"
      });
    }
  }
);

module.exports = router;