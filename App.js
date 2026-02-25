import { StatusBar } from "expo-status-bar";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  ImageBackground,
  LogBox,
  PanResponder,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

LogBox.ignoreLogs(["Non-serializable values", "Setting a timer", "AsyncStorage", "Possible Unhandled Promise", "SafeAreaView has been deprecated", "React DevTools"]);
import { Component, useCallback, useEffect, useRef, useState } from "react";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { io } from "socket.io-client";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/* ── Safe AsyncStorage wrapper ── */
let _asyncStorage = null;
try { _asyncStorage = require("@react-native-async-storage/async-storage").default; } catch (e) {}
const SafeStorage = {
  getItem: async (key) => { try { return _asyncStorage ? await _asyncStorage.getItem(key) : null; } catch (e) { return null; } },
  setItem: async (key, val) => { try { if (_asyncStorage) await _asyncStorage.setItem(key, val); } catch (e) {} },
};

/* ══════════════ TRANSLATIONS ══════════════ */
const TRANSLATIONS = {
  tr: {
    splash: { subtitle: 'Hadi partiye başlayalım' },
    error: { title: 'Bir hata oluştu', retry: 'Tekrar Dene' },
    home: {
      title: 'Shot Challenge',
      subtitle: 'Hadi partiye başlayalım!',
      selectMode: 'Oyun Modu Seç',
      yourName: 'İSMİN',
      namePlaceholder: 'Adını gir...',
      createRoom: 'Oda Oluştur',
      joinRoom: 'Odaya Katıl',
      newRoom: 'Yeni Oda Oluştur',
      roomCode: 'Oda kodu',
    },
    modes: {
      title: 'Oyun Modu',
      subtitle: 'Nasıl oynamak istersin?',
      neverTitle: 'Ben Daha Önce Hiç',
      neverDesc: 'Tek kişilik, kaydır ve geç',
      dareTitle: 'Yap Ya da İç',
      dareDesc: 'İsimleri ekle, rastgele çıksın',
      challengerTitle: 'Challenger',
      challengerDesc: 'Oylama, sayı yarışı, hedef seçme',
      selectVersion: 'Mod Seç',
      selectVersionSub: 'Hangi versiyonu tercih edersin?',
      normalTitle: 'Normal',
      normalDesc: 'Herkes için uygun sorular',
      girlsTitle: 'Kız Kıza',
      girlsDesc: 'Sadece kızlar arasında',
      neverNormalLabel: 'Ben Daha Önce Hiç - Normal',
      neverGirlsLabel: 'Ben Daha Önce Hiç - Kız Kıza',
      dareLabel: 'Yap Ya da İç',
      challengerLabel: 'Challenger',
    },
    dareSetup: {
      title: 'Oyuncular',
      playerName: 'OYUNCU İSMİ',
      namePlaceholder: 'İsim gir...',
      players: 'OYUNCULAR',
      noPlayers: 'Henüz oyuncu eklenmedi',
      addHint: 'Yukarıdan isim ekleyin',
      startGame: 'Oyunu Başlat',
    },
    lobby: {
      title: 'Lobi',
      roomCode: 'ODA KODU',
      shareHint: 'Arkadaşlarınla paylaş',
      players: 'OYUNCULAR',
      startGame: 'Oyunu Başlat',
      waitingHost: 'Host oyunu başlatacak',
    },
    game: {
      title: 'Oyun',
      results: 'SONUÇLAR',
      did: 'Yaptım ✅',
      didNot: 'Yapmadım ❌',
      turn: 'SIRA',
      vote: 'OY VER',
      me: '(Ben)',
      submitVote: 'Oyu Gönder',
      enterNumber: 'SAYINI GİR',
      submit: 'Gönder',
      selectOne: 'BİRİNİ SEÇ',
      nextPlayer: 'Sıradaki oyuncu',
      result: 'SONUÇ',
      swipe: 'Kaydır',
    },
    toast: {
      nameRequired: 'Önce ismini yaz.',
      selectMode: 'Bir oyun modu seç.',
      enterCode: 'Oda kodunu gir.',
      emptyName: 'İsim boş olamaz.',
      duplicateName: 'Bu isim zaten eklendi.',
      minPlayers: 'En az 2 oyuncu gerekli.',
      noQuestions: 'Bu mod için henüz soru eklenmedi.',
      connectionError: 'Sunucuya bağlanılamıyor. Server çalışıyor mu?',
      disconnected: 'Bağlantı koptu, yeniden bağlanılıyor...',
      reconnected: 'Bağlantı yeniden kuruldu!',
      connectionFailed: 'Sunucuya bağlanılamıyor. İnternetini kontrol et.',
      genericError: 'Bir hata oluştu.',
    },
    format: {
      readyCount: (n) => `${n} kişi hazır`,
      waitingCount: (n) => `${n} oyuncu bekleniyor`,
      answerCount: (n, m) => `Cevaplayan: ${n}/${m}`,
      question: (n) => `Soru ${n}`,
      selecting: (name) => `${name} seçim yapıyor`,
      swipeHint: 'Kaydırarak sonraki soruya geç',
    },
    questionsNeverNormal: [
      'Ben daha önce hiç gerçekten sevmediğim birine seni seviyorum dedim.',
      'Ben daha önce hiç aynı anda iki veya daha fazla kişiyle flörtleştim.',
      'Ben daha önce hiç sevgilinin telefonunu habersiz olarak karıştırdım.',
      'Ben daha önce hiç burnumu karıştırıp bir yere sürmedim.',
      'Ben daha önce hiç toplu taşımada osurmadım.',
      'Ben daha önce hiç yalan söyleyerek işten/okuldan izin almadım.',
      'Ben daha önce hiç birinin gözünün içine bakarak yalan söylemedim.',
      'Ben daha önce hiç utancımdan yerin dibine girmek istemedim.',
      'Ben daha önce hiç eski sevgilimi sarhoşken aramadım.',
      'Ben daha önce hiç telefona bakmayıp uyuyordum yalanını söylemedim.',
      'Ben daha önce hiç biriyle tartışmamak için tamam demedim.',
      'Ben daha önce hiç trafikte kavga etmedim.',
      'Ben daha önce hiç sarhoşken kusmadım.',
      'Ben daha önce hiç ne yaptığımı unutacak kadar içmedim.',
      'Ben daha önce hiç istemediğim birini ortamı bozmamak için idare etmedim.',
      'Ben daha önce hiç sadece ilgi almak için birini kabul etmedim.',
      'Ben daha önce hiç çok sevdiğim birine üzülmemesi için pembe yalan söylemedim.',
      'Ben daha önce hiç olmaması gereken birine aşık olmadım.',
      'Ben daha önce hiç göndeme story atmadım.',
      'Ben daha önce hiç situationship yaşamadım.',
      'Ben daha önce hiç yakın arkadaşıma gizli ilgi duymadım.',
      'Ben daha önce hiç birini kıskandırmak için başkasını kullanmadım.',
      'Ben daha önce hiç birini unutamadığım için ağlamadım.',
      'Ben daha önce hiç 1 kişiden fazla flört yapmadım.',
      'Ben daha önce hiç sevgilim varken başkasını özlemedim.',
      'Ben daha önce hiç sosyal medyadan biriyle tanışmadım.',
      'Ben daha önce hiç mekanda tanıştığım biriyle konuşmadım.',
      'Ben daha önce hiç fake hesaptan birine yazmadım.',
      'Ben daha önce hiç sevgilimin eski sevgilisini stalklamadım.',
      'Ben daha önce hiç ekran görüntüsünü yanlış kişiye göndermedim.',
      'Ben daha önce hiç sevgilimin telefonunu karıştırmadım.',
      'Ben daha önce hiç birini ghostlamadım.',
      'Ben daha önce hiç aldatıldığımı bildiğim halde ilişkiye devam etmedim.',
      'Ben daha önce hiç çok büyük bir sır saklamadım.',
      'Ben daha önce hiç sıkıldığım için tartışma çıkarmadım.',
      'Ben daha önce hiç durumdan kurtulmak için ağlamadım.',
      'Ben daha önce hiç bir yerden kaçmak için birine beni ara yazmadım.',
      'Ben daha önce hiç istemediğim birini öpmedim.',
      'Ben daha önce hiç siyasi görüşüm hakkında yalan söylemedim.',
      'Ben daha önce hiç arkadaşımı idare etmek için yalanına destek çıkmadım.',
      'Ben daha önce hiç gördüğüm birini tanımamış gibi yapmadım.',
      'Ben daha önce hiç sosyal medyadan biriyle tartışmadım.',
      'Ben daha önce hiç birine inanmadığım halde destek vermedim.',
      'Ben daha önce hiç birine takıntılı olmadım.',
      'Ben daha önce hiç partnerimi kıskandırmak için bir şey yapmadım.',
      'Ben daha önce hiç kıskandığım halde kıskanmamış gibi davranmadım.',
      'Ben daha önce hiç exten next denemesi yapmadım.',
      'Ben daha önce hiç kimsenin storysine alev atmadım.',
      'Ben daha önce hiç sadece dış görünüşü için birine ilgi duymadım.',
      'Ben daha önce hiç sevgilimle arkadaşımın dedikodusunu yapmadım.',
      'Ben daha önce hiç yanlış kişiye mesaj gönderdim.',
      'Ben daha önce hiç karaoke yapmadım.',
      'Ben daha önce hiç sahte bir bahane uydurdum.',
      'Ben daha önce hiç birine aşık olduğumu itiraf edemedim.',
      'Ben daha önce hiç alkollüyken alışveriş yapmadım.',
      'Ben daha önce hiç bir arkadaşımın sırrını başkasına söylemedim.',
      'Ben daha önce hiç bir randevuya geç kalmadım.',
      'Ben daha önce hiç duşta şarkı söylemedim.',
      'Ben daha önce hiç birinden intikam almadım.',
      'Ben daha önce hiç bir filmde ağlamadım.',
      'Ben daha önce hiç yemek yaparken mutfağı yakacak gibi olmadım.',
      'Ben daha önce hiç halka açık bir yerde düşmedim.',
      'Ben daha önce hiç gece geç saatte buzdolabını açıp yemek yemedim.',
      'Ben daha önce hiç bir partide uyuyakalmadım.',
      'Ben daha önce hiç birinin hediyesini beğenmemiş gibi yapmadım.',
      'Ben daha önce hiç spor salonuna yazılıp gitmeyeceğim bir üyelik almadım.',
      'Ben daha önce hiç bir arkadaşımla aynı kişiden hoşlanmadım.',
      'Ben daha önce hiç sosyal medyada takipçi kasmadım.',
      'Ben daha önce hiç birine borç verip geri isteyemedim.',
      'Ben daha önce hiç yanlışlıkla sesli mesaj gönderdim.',
      'Ben daha önce hiç canım sıkkınken alışveriş yapmadım.',
      'Ben daha önce hiç birine gizlice hediye almadım.',
      'Ben daha önce hiç bir tartışmada haklı olduğum halde özür dilemedim.',
      'Ben daha önce hiç tanımadığım birinden numara istemedim.',
      'Ben daha önce hiç bir şarkıyı yanlış sözlerle söylemedim.',
      'Ben daha önce hiç birinin doğum gününü unutmadım.',
      'Ben daha önce hiç aşırı derecede klostrofobik olmadım.',
      'Ben daha önce hiç yabancı birine el sallamadım.',
    ],
    questionsNeverGirls: [
      'Ben daha önce hiç en yakın arkadaşıma sevgili dedikodusu anlatmadım.',
      'Ben daha önce hiç hazırlanırken saatlerce kıyafet seçmedim.',
      'Ben daha önce hiç eski sevgiliyi gizlice stalklamadım.',
      'Ben daha önce hiç arkadaşımın rujunu izinsiz kullanmadım.',
      'Ben daha önce hiç kız kıza buluşmada drama çıkarmadım.',
      'Ben daha önce hiç erkek arkadaşıma başka kızı kıskandırmak için bahsetmedim.',
      'Ben daha önce hiç tuvalette 30 dakika fotoğraf çekmedim.',
      'Ben daha önce hiç eski sevgilimi sarhoşken aramadım.',
      'Ben daha önce hiç telefona bakmayıp uyuyordum yalanını söylemedim.',
      'Ben daha önce hiç sadece ilgi almak için birini kabul etmedim.',
      'Ben daha önce hiç çok sevdiğim birine üzülmemesi için pembe yalan söylemedim.',
      'Ben daha önce hiç olmaması gereken birine aşık olmadım.',
      'Ben daha önce hiç situationship yaşamadım.',
      'Ben daha önce hiç yakın arkadaşıma gizli ilgi duymadım.',
      'Ben daha önce hiç birini kıskandırmak için başkasını kullanmadım.',
      'Ben daha önce hiç birini unutamadığım için ağlamadım.',
      'Ben daha önce hiç sevgilim varken başkasını özlemedim.',
      'Ben daha önce hiç fake hesaptan birine yazmadım.',
      'Ben daha önce hiç sevgilimin eski sevgilisini stalklamadım.',
      'Ben daha önce hiç ekran görüntüsünü yanlış kişiye göndermedim.',
      'Ben daha önce hiç birini ghostlamadım.',
      'Ben daha önce hiç aldatıldığımı bildiğim halde ilişkiye devam etmedim.',
      'Ben daha önce hiç sıkıldığım için tartışma çıkarmadım.',
      'Ben daha önce hiç durumdan kurtulmak için ağlamadım.',
      'Ben daha önce hiç bir yerden kaçmak için birine beni ara yazmadım.',
      'Ben daha önce hiç istemediğim birini öpmedim.',
      'Ben daha önce hiç partnerimi kıskandırmak için bir şey yapmadım.',
      'Ben daha önce hiç kıskandığım halde kıskanmamış gibi davranmadım.',
      'Ben daha önce hiç exten next denemesi yapmadım.',
      'Ben daha önce hiç kimsenin storysine alev atmadım.',
      'Ben daha önce hiç sevgilimle arkadaşımın dedikodusunu yapmadım.',
      'Ben daha önce hiç göndeme story atmadım.',
      'Ben daha önce hiç sadece dış görünüşü için birine ilgi duymadım.',
      'Ben daha önce hiç birine takıntılı olmadım.',
      'Ben daha önce hiç makyajsız sokağa çıkmadım.',
      'Ben daha önce hiç dizi izlerken ağlamadım.',
      'Ben daha önce hiç alışverişte bütçemi aşmadım.',
      'Ben daha önce hiç bir erkek için arkadaşımla tartışmadım.',
      'Ben daha önce hiç sosyal medyada birini kıskandırmak için story paylaşmadım.',
      'Ben daha önce hiç diyet yapıyorum deyip gizlice atıştırmadım.',
      'Ben daha önce hiç bir erkekle sadece ilgi görmek için konuşmadım.',
      'Ben daha önce hiç eski erkek arkadaşımın yeni sevgilisini stalklamadım.',
      'Ben daha önce hiç güzellik ürünlerine aşırı para harcamadım.',
      'Ben daha önce hiç bir arkadaşıma onun hakkında dedikodu yapıldığını söylemedim.',
      'Ben daha önce hiç bir erkeğin mesajını bilerek geç cevaplamadım.',
      'Ben daha önce hiç kız gecesinde çok fazla içmedim.',
      'Ben daha önce hiç bir erkeğe hint verip onun anlamasını beklemedim.',
      'Ben daha önce hiç bir partide bilerek dikkat çekecek kıyafet giymedim.',
    ],
    questionsDareBasic: [
      'Telefonundaki son mesajı gruba oku ya da iç.',
      'Karşındaki kişiye iltifat et ya da iç.',
      '10 saniye göz teması kur ya da iç.',
      'Son aradığın kişiyi ara ve selam ver ya da iç.',
      'En utanç verici anını anlat ya da iç.',
      'Grubun en komik taklidi yap ya da iç.',
      'Telefonundaki en son çektiğin fotoğrafı göster ya da iç.',
      'En çok hoşlandığın kişinin adını söyle ya da iç.',
      'Bir dakika boyunca hiç konuşma ya da iç.',
      'Dans et ya da iç.',
      'Telefonundaki son DM\'i oku ya da iç.',
      '30 saniye boyunca tavuk dansı yap ya da iç.',
      'Sağındaki kişiye sarıl ya da iç.',
      'En son ağladığın anı anlat ya da iç.',
      'Telefondaki son aramanı göster ya da iç.',
      'Gruptaki birine 1-10 arası puan ver ya da iç.',
      'Bir dakika boyunca göz kırpmadan dur ya da iç.',
      'En yakın arkadaşına "seni seviyorum" mesajı at ya da iç.',
      'Instagram\'daki son beğendiğin fotoğrafı göster ya da iç.',
      'Komik bir fıkra anlat, kimse gülmezse iç.',
      'Karşındaki kişinin en iyi özelliğini söyle ya da iç.',
      'Gruptaki en yakışıklı/güzel kişiyi seç ya da iç.',
      '20 saniye boyunca plank yap ya da iç.',
      'Son sildiğin mesajı anlat ya da iç.',
      'Telefon rehberindeki son kişiyi ara ya da iç.',
      'En utandığın sosyal medya paylaşımını göster ya da iç.',
      'Bir dakika boyunca aksanla konuş ya da iç.',
      'Gruptaki birinin taklidi yap, bilinmezse iç.',
      'En son ne zaman yalan söylediğini itiraf et ya da iç.',
      'Solundaki kişiye bir meydan okuma ver ya da iç.',
      'Herkesin önünde 10 şınav çek ya da iç.',
      'En garip alışkanlığını itiraf et ya da iç.',
      'Bir şarkının nakaratını söyle ya da iç.',
      'Annene şimdi "seni çok seviyorum" mesajı at ya da iç.',
      'Gruptaki birine takma ad tak ya da iç.',
      'Karşındaki kişiyle selfie çek ya da iç.',
      'Son YouTube geçmişini göster ya da iç.',
      'Bir hayvanın sesini çıkar ya da iç.',
      'Gözlerin kapalı telefona mesaj yaz ve gönder ya da iç.',
      'En son hangi ünlüyü stalkladığını söyle ya da iç.',
      'Telefonundaki en eski fotoğrafı göster ya da iç.',
      'Gruptaki birinin en iyi 3 özelliğini say ya da iç.',
      'En sevdiğin şarkıyı 10 saniye söyle ya da iç.',
      'Ayna karşısında en çok yaptığın pozu yap ya da iç.',
    ],
  },
  en: {
    splash: { subtitle: "Let's get the party started" },
    error: { title: 'An error occurred', retry: 'Try Again' },
    home: {
      title: 'Shot Challenge',
      subtitle: "Let's get the party started!",
      selectMode: 'Select Game Mode',
      yourName: 'YOUR NAME',
      namePlaceholder: 'Enter your name...',
      createRoom: 'Create Room',
      joinRoom: 'Join Room',
      newRoom: 'Create New Room',
      roomCode: 'Room code',
    },
    modes: {
      title: 'Game Mode',
      subtitle: 'How do you want to play?',
      neverTitle: 'Never Have I Ever',
      neverDesc: 'Solo play, swipe to continue',
      dareTitle: 'Do or Drink',
      dareDesc: 'Add names, random picks',
      challengerTitle: 'Challenger',
      challengerDesc: 'Voting, number race, target pick',
      selectVersion: 'Select Mode',
      selectVersionSub: 'Which version do you prefer?',
      normalTitle: 'Normal',
      normalDesc: 'Questions for everyone',
      girlsTitle: 'Girls Only',
      girlsDesc: 'Just between the girls',
      neverNormalLabel: 'Never Have I Ever - Normal',
      neverGirlsLabel: 'Never Have I Ever - Girls Only',
      dareLabel: 'Do or Drink',
      challengerLabel: 'Challenger',
    },
    dareSetup: {
      title: 'Players',
      playerName: 'PLAYER NAME',
      namePlaceholder: 'Enter name...',
      players: 'PLAYERS',
      noPlayers: 'No players added yet',
      addHint: 'Add names above',
      startGame: 'Start Game',
    },
    lobby: {
      title: 'Lobby',
      roomCode: 'ROOM CODE',
      shareHint: 'Share with your friends',
      players: 'PLAYERS',
      startGame: 'Start Game',
      waitingHost: 'Waiting for host to start',
    },
    game: {
      title: 'Game',
      results: 'RESULTS',
      did: 'I did ✅',
      didNot: "I didn't ❌",
      turn: 'TURN',
      vote: 'VOTE',
      me: '(Me)',
      submitVote: 'Submit Vote',
      enterNumber: 'ENTER YOUR NUMBER',
      submit: 'Submit',
      selectOne: 'SELECT ONE',
      nextPlayer: 'Next player',
      result: 'RESULT',
      swipe: 'Swipe',
    },
    toast: {
      nameRequired: 'Enter your name first.',
      selectMode: 'Select a game mode.',
      enterCode: 'Enter the room code.',
      emptyName: 'Name cannot be empty.',
      duplicateName: 'This name is already added.',
      minPlayers: 'At least 2 players required.',
      noQuestions: 'No questions added for this mode yet.',
      connectionError: 'Cannot connect to server. Is the server running?',
      disconnected: 'Connection lost, reconnecting...',
      reconnected: 'Connection restored!',
      connectionFailed: 'Cannot connect to server. Check your internet.',
      genericError: 'An error occurred.',
    },
    format: {
      readyCount: (n) => `${n} players ready`,
      waitingCount: (n) => `${n} players waiting`,
      answerCount: (n, m) => `Answered: ${n}/${m}`,
      question: (n) => `Question ${n}`,
      selecting: (name) => `${name} is choosing`,
      swipeHint: 'Swipe for next question',
    },
    questionsNeverNormal: [
      "I have never told someone I love you without really meaning it.",
      "I have never flirted with two or more people at the same time.",
      "I have never secretly checked my partner's phone.",
      "I have never picked my nose and wiped it somewhere.",
      "I have never farted on public transport.",
      "I have never lied to skip work or school.",
      "I have never looked someone in the eye while lying.",
      "I have never wanted the ground to swallow me from embarrassment.",
      "I have never drunk-called my ex.",
      "I have never pretended to be asleep to avoid answering my phone.",
      "I have never said okay just to avoid an argument.",
      "I have never got into a road rage fight.",
      "I have never thrown up while drunk.",
      "I have never been so drunk I forgot what I did.",
      "I have never tolerated someone I didn't like just to keep the peace.",
      "I have never accepted someone just for the attention.",
      "I have never told a white lie to someone I love to protect their feelings.",
      "I have never fallen for someone I shouldn't have.",
      "I have never posted a trending story just for views.",
      "I have never been in a situationship.",
      "I have never secretly had feelings for a close friend.",
      "I have never used someone else to make another person jealous.",
      "I have never cried because I couldn't get over someone.",
      "I have never flirted with more than one person at a time.",
      "I have never missed someone else while in a relationship.",
      "I have never met someone through social media.",
      "I have never kept talking to someone I met at a bar or club.",
      "I have never texted someone from a fake account.",
      "I have never stalked my partner's ex on social media.",
      "I have never accidentally sent a screenshot to the wrong person.",
      "I have never snooped through my partner's phone.",
      "I have never ghosted someone.",
      "I have never stayed in a relationship knowing I was being cheated on.",
      "I have never kept a really big secret.",
      "I have never started a fight out of boredom.",
      "I have never cried to get out of a situation.",
      "I have never texted someone 'call me' just to escape somewhere.",
      "I have never kissed someone I didn't want to kiss.",
      "I have never lied about my political views.",
      "I have never backed up a friend's lie to cover for them.",
      "I have never pretended not to recognize someone I saw.",
      "I have never argued with someone on social media.",
      "I have never supported someone I didn't actually believe in.",
      "I have never been obsessed with someone.",
      "I have never done something to make my partner jealous.",
      "I have never acted like I wasn't jealous when I really was.",
      "I have never tried to rebound right after a breakup.",
      "I have never sent a flame reaction to anyone's story.",
      "I have never been attracted to someone just for their looks.",
      "I have never gossiped about a friend with my partner.",
      "I have never sent a message to the wrong person.",
      "I have never done karaoke.",
      "I have never made up a fake excuse.",
      "I have never been unable to confess my feelings to someone.",
      "I have never shopped while drunk.",
      "I have never told someone else a friend's secret.",
      "I have never been late to a date.",
      "I have never sung in the shower.",
      "I have never taken revenge on someone.",
      "I have never cried during a movie.",
      "I have never almost set the kitchen on fire while cooking.",
      "I have never fallen down in public.",
      "I have never raided the fridge late at night.",
      "I have never fallen asleep at a party.",
      "I have never pretended to like a gift I received.",
      "I have never signed up for a gym membership I never used.",
      "I have never liked the same person as my friend.",
      "I have never tried to farm followers on social media.",
      "I have never lent money and been too afraid to ask for it back.",
      "I have never accidentally sent a voice message.",
      "I have never stress-shopped when I was feeling down.",
      "I have never secretly bought a gift for someone.",
      "I have never apologized in an argument even though I was right.",
      "I have never asked for a stranger's number.",
      "I have never sung a song with the wrong lyrics.",
      "I have never forgotten someone's birthday.",
      "I have never been extremely claustrophobic.",
      "I have never waved at a stranger.",
    ],
    questionsNeverGirls: [
      "I have never told my best friend all the relationship gossip.",
      "I have never spent hours picking an outfit before going out.",
      "I have never secretly stalked an ex.",
      "I have never used my friend's lipstick without asking.",
      "I have never caused drama at a girls' night out.",
      "I have never mentioned another girl to my boyfriend to make him jealous.",
      "I have never spent 30 minutes taking photos in the bathroom.",
      "I have never drunk-called my ex.",
      "I have never pretended to be asleep to avoid answering my phone.",
      "I have never accepted someone just for the attention.",
      "I have never told a white lie to someone I love to protect their feelings.",
      "I have never fallen for someone I shouldn't have.",
      "I have never been in a situationship.",
      "I have never secretly had feelings for a close friend.",
      "I have never used someone else to make another person jealous.",
      "I have never cried because I couldn't get over someone.",
      "I have never missed someone else while in a relationship.",
      "I have never texted someone from a fake account.",
      "I have never stalked my partner's ex on social media.",
      "I have never accidentally sent a screenshot to the wrong person.",
      "I have never ghosted someone.",
      "I have never stayed in a relationship knowing I was being cheated on.",
      "I have never started a fight out of boredom.",
      "I have never cried to get out of a situation.",
      "I have never texted someone 'call me' just to escape somewhere.",
      "I have never kissed someone I didn't want to kiss.",
      "I have never done something to make my partner jealous.",
      "I have never acted like I wasn't jealous when I really was.",
      "I have never tried to rebound right after a breakup.",
      "I have never sent a flame reaction to anyone's story.",
      "I have never gossiped about a friend with my partner.",
      "I have never posted a trending story just for views.",
      "I have never been attracted to someone just for their looks.",
      "I have never been obsessed with someone.",
      "I have never gone outside without makeup.",
      "I have never cried while watching a TV series.",
      "I have never gone over budget while shopping.",
      "I have never fought with a friend over a guy.",
      "I have never posted a story on social media to make someone jealous.",
      "I have never secretly snacked while claiming to be on a diet.",
      "I have never talked to a guy just for the attention.",
      "I have never stalked my ex-boyfriend's new girlfriend.",
      "I have never spent too much money on beauty products.",
      "I have never told a friend that people were gossiping about her.",
      "I have never intentionally replied late to a guy's message.",
      "I have never had too much to drink at a girls' night.",
      "I have never dropped hints to a guy and waited for him to figure it out.",
      "I have never worn an outfit to a party specifically to get attention.",
    ],
    questionsDareBasic: [
      'Read the last message on your phone to the group or drink.',
      'Give the person across from you a compliment or drink.',
      'Hold eye contact for 10 seconds or drink.',
      'Call the last person you called and say hello or drink.',
      'Tell your most embarrassing moment or drink.',
      'Do the funniest impression of someone in the group or drink.',
      'Show the last photo you took on your phone or drink.',
      'Say the name of the person you like most or drink.',
      'Stay silent for one full minute or drink.',
      'Dance or drink.',
      "Read your last DM out loud or drink.",
      'Do the chicken dance for 30 seconds or drink.',
      'Hug the person to your right or drink.',
      'Tell about the last time you cried or drink.',
      'Show your last phone call or drink.',
      'Rate someone in the group from 1-10 or drink.',
      'Try not to blink for a full minute or drink.',
      'Text your best friend "I love you" or drink.',
      "Show the last photo you liked on Instagram or drink.",
      "Tell a joke — if no one laughs, you drink.",
      "Say the best quality of the person across from you or drink.",
      'Pick the most attractive person in the group or drink.',
      'Hold a plank for 20 seconds or drink.',
      'Describe the last message you deleted or drink.',
      'Call the last contact in your phone book or drink.',
      'Show your most embarrassing social media post or drink.',
      'Speak in an accent for one minute or drink.',
      "Impersonate someone in the group — if nobody guesses, you drink.",
      'Confess the last time you lied or drink.',
      'Give the person to your left a dare or drink.',
      'Do 10 push-ups in front of everyone or drink.',
      'Confess your weirdest habit or drink.',
      'Sing the chorus of a song or drink.',
      'Text your mom "I love you so much" right now or drink.',
      'Give someone in the group a nickname or drink.',
      'Take a selfie with the person across from you or drink.',
      'Show your recent YouTube history or drink.',
      'Make an animal sound or drink.',
      'Type and send a text with your eyes closed or drink.',
      'Name the last celebrity you stalked or drink.',
      'Show the oldest photo on your phone or drink.',
      "List the top 3 qualities of someone in the group or drink.",
      'Sing your favorite song for 10 seconds or drink.',
      'Strike your go-to mirror pose or drink.',
    ],
  },
  de: {
    splash: { subtitle: "Lass die Party beginnen" },
    error: { title: 'Ein Fehler ist aufgetreten', retry: 'Erneut versuchen' },
    home: {
      title: 'Shot Challenge',
      subtitle: 'Lass die Party beginnen!',
      selectMode: 'Spielmodus wählen',
      yourName: 'DEIN NAME',
      namePlaceholder: 'Namen eingeben...',
      createRoom: 'Raum erstellen',
      joinRoom: 'Raum beitreten',
      newRoom: 'Neuen Raum erstellen',
      roomCode: 'Raumcode',
    },
    modes: {
      title: 'Spielmodus',
      subtitle: 'Wie willst du spielen?',
      neverTitle: 'Ich hab noch nie',
      neverDesc: 'Solo spielen, wischen und weiter',
      dareTitle: 'Mach oder Trink',
      dareDesc: 'Namen hinzufügen, zufällige Auswahl',
      challengerTitle: 'Challenger',
      challengerDesc: 'Abstimmung, Zahlenduell, Ziel wählen',
      selectVersion: 'Modus wählen',
      selectVersionSub: 'Welche Version bevorzugst du?',
      normalTitle: 'Normal',
      normalDesc: 'Fragen für alle',
      girlsTitle: 'Mädelsrunde',
      girlsDesc: 'Nur unter Mädels',
      neverNormalLabel: 'Ich hab noch nie - Normal',
      neverGirlsLabel: 'Ich hab noch nie - Mädelsrunde',
      dareLabel: 'Mach oder Trink',
      challengerLabel: 'Challenger',
    },
    dareSetup: {
      title: 'Spieler',
      playerName: 'SPIELERNAME',
      namePlaceholder: 'Name eingeben...',
      players: 'SPIELER',
      noPlayers: 'Noch keine Spieler hinzugefügt',
      addHint: 'Namen oben hinzufügen',
      startGame: 'Spiel starten',
    },
    lobby: {
      title: 'Lobby',
      roomCode: 'RAUMCODE',
      shareHint: 'Teile es mit deinen Freunden',
      players: 'SPIELER',
      startGame: 'Spiel starten',
      waitingHost: 'Warten auf den Host',
    },
    game: {
      title: 'Spiel',
      results: 'ERGEBNISSE',
      did: 'Hab ich ✅',
      didNot: 'Hab ich nicht ❌',
      turn: 'DRAN',
      vote: 'ABSTIMMEN',
      me: '(Ich)',
      submitVote: 'Stimme abgeben',
      enterNumber: 'ZAHL EINGEBEN',
      submit: 'Absenden',
      selectOne: 'WÄHLE EINE PERSON',
      nextPlayer: 'Nächster Spieler',
      result: 'ERGEBNIS',
      swipe: 'Wischen',
    },
    toast: {
      nameRequired: 'Gib zuerst deinen Namen ein.',
      selectMode: 'Wähle einen Spielmodus.',
      enterCode: 'Gib den Raumcode ein.',
      emptyName: 'Name darf nicht leer sein.',
      duplicateName: 'Dieser Name wurde bereits hinzugefügt.',
      minPlayers: 'Mindestens 2 Spieler erforderlich.',
      noQuestions: 'Noch keine Fragen für diesen Modus.',
      connectionError: 'Verbindung zum Server nicht möglich. Läuft der Server?',
      disconnected: 'Verbindung unterbrochen, wird wiederhergestellt...',
      reconnected: 'Verbindung wiederhergestellt!',
      connectionFailed: 'Verbindung zum Server nicht möglich. Überprüfe dein Internet.',
      genericError: 'Ein Fehler ist aufgetreten.',
    },
    format: {
      readyCount: (n) => `${n} Spieler bereit`,
      waitingCount: (n) => `${n} Spieler warten`,
      answerCount: (n, m) => `Geantwortet: ${n}/${m}`,
      question: (n) => `Frage ${n}`,
      selecting: (name) => `${name} wählt aus`,
      swipeHint: 'Wische für die nächste Frage',
    },
    questionsNeverNormal: [
      'Ich hab noch nie jemandem "Ich liebe dich" gesagt, ohne es zu meinen.',
      'Ich hab noch nie gleichzeitig mit zwei oder mehr Personen geflirtet.',
      'Ich hab noch nie heimlich das Handy meines Partners durchsucht.',
      'Ich hab noch nie in der Nase gebohrt und es irgendwo abgewischt.',
      'Ich hab noch nie in öffentlichen Verkehrsmitteln gefurzt.',
      'Ich hab noch nie gelogen, um frei von der Arbeit/Schule zu bekommen.',
      'Ich hab noch nie jemandem direkt in die Augen geschaut und dabei gelogen.',
      'Ich hab noch nie vor Scham im Boden versinken wollen.',
      'Ich hab noch nie meinen Ex betrunken angerufen.',
      'Ich hab noch nie so getan, als würde ich schlafen, um nicht ans Handy zu gehen.',
      'Ich hab noch nie "okay" gesagt, nur um einen Streit zu vermeiden.',
      'Ich hab noch nie im Straßenverkehr Streit gehabt.',
      'Ich hab noch nie betrunken erbrochen.',
      'Ich hab noch nie so viel getrunken, dass ich vergessen habe, was ich getan habe.',
      'Ich hab noch nie jemanden ertragen, den ich nicht mochte, nur um die Stimmung nicht zu ruinieren.',
      'Ich hab noch nie jemanden nur wegen der Aufmerksamkeit akzeptiert.',
      'Ich hab noch nie eine Notlüge erzählt, um jemanden nicht zu verletzen.',
      'Ich hab noch nie mich in jemanden verliebt, in den ich mich nicht verlieben sollte.',
      'Ich hab noch nie eine Story nur für Trends gepostet.',
      'Ich hab noch nie eine Situationship gehabt.',
      'Ich hab noch nie heimlich Gefühle für einen engen Freund gehabt.',
      'Ich hab noch nie jemand anderen benutzt, um eine Person eifersüchtig zu machen.',
      'Ich hab noch nie geweint, weil ich jemanden nicht vergessen konnte.',
      'Ich hab noch nie mit mehr als einer Person gleichzeitig geflirtet.',
      'Ich hab noch nie jemand anderen vermisst, während ich in einer Beziehung war.',
      'Ich hab noch nie jemanden über Social Media kennengelernt.',
      'Ich hab noch nie mit jemandem weiter geredet, den ich in einer Bar kennengelernt habe.',
      'Ich hab noch nie jemandem von einem Fake-Account geschrieben.',
      'Ich hab noch nie den Ex meines Partners auf Social Media gestalkt.',
      'Ich hab noch nie versehentlich einen Screenshot an die falsche Person geschickt.',
      'Ich hab noch nie das Handy meines Partners durchsucht.',
      'Ich hab noch nie jemanden geghostet.',
      'Ich hab noch nie eine Beziehung weitergeführt, obwohl ich wusste, dass ich betrogen wurde.',
      'Ich hab noch nie ein richtig großes Geheimnis bewahrt.',
      'Ich hab noch nie aus Langeweile einen Streit angefangen.',
      'Ich hab noch nie geweint, um aus einer Situation rauszukommen.',
      'Ich hab noch nie jemandem geschrieben "Ruf mich an", nur um irgendwo zu entkommen.',
      'Ich hab noch nie jemanden geküsst, den ich nicht küssen wollte.',
      'Ich hab noch nie über meine politische Meinung gelogen.',
      'Ich hab noch nie die Lüge eines Freundes gedeckt.',
      'Ich hab noch nie so getan, als würde ich jemanden nicht erkennen.',
      'Ich hab noch nie mit jemandem in den sozialen Medien gestritten.',
      'Ich hab noch nie jemanden unterstützt, an den ich nicht wirklich geglaubt habe.',
      'Ich hab noch nie eine Obsession für jemanden gehabt.',
      'Ich hab noch nie etwas getan, um meinen Partner eifersüchtig zu machen.',
      'Ich hab noch nie so getan, als wäre ich nicht eifersüchtig, obwohl ich es war.',
      'Ich hab noch nie direkt nach einer Trennung einen Rebound versucht.',
      'Ich hab noch nie auf jemandes Story mit einer Flamme reagiert.',
      'Ich hab noch nie mich nur wegen des Aussehens zu jemandem hingezogen gefühlt.',
      'Ich hab noch nie mit meinem Partner über einen Freund gelästert.',
      'Ich hab noch nie eine Nachricht an die falsche Person geschickt.',
      'Ich hab noch nie Karaoke gemacht.',
      'Ich hab noch nie eine falsche Ausrede erfunden.',
      'Ich hab noch nie es nicht geschafft, jemandem meine Gefühle zu gestehen.',
      'Ich hab noch nie betrunken online eingekauft.',
      'Ich hab noch nie das Geheimnis eines Freundes jemand anderem erzählt.',
      'Ich hab noch nie mich zu einem Date verspätet.',
      'Ich hab noch nie unter der Dusche gesungen.',
      'Ich hab noch nie mich an jemandem gerächt.',
      'Ich hab noch nie bei einem Film geweint.',
      'Ich hab noch nie beim Kochen fast die Küche abgefackelt.',
      'Ich hab noch nie in der Öffentlichkeit hingefallen.',
      'Ich hab noch nie spät nachts den Kühlschrank geplündert.',
      'Ich hab noch nie auf einer Party eingeschlafen.',
      'Ich hab noch nie so getan, als würde mir ein Geschenk gefallen.',
      'Ich hab noch nie eine Fitnessstudio-Mitgliedschaft abgeschlossen, die ich nie genutzt habe.',
      'Ich hab noch nie dieselbe Person gemocht wie mein Freund.',
      'Ich hab noch nie versucht, Follower auf Social Media zu sammeln.',
      'Ich hab noch nie jemandem Geld geliehen und es nicht zurückverlangt.',
      'Ich hab noch nie versehentlich eine Sprachnachricht geschickt.',
      'Ich hab noch nie aus Frust eingekauft.',
      'Ich hab noch nie heimlich jemandem ein Geschenk gekauft.',
      'Ich hab noch nie mich in einem Streit entschuldigt, obwohl ich recht hatte.',
      'Ich hab noch nie einen Fremden nach seiner Nummer gefragt.',
      'Ich hab noch nie ein Lied mit falschen Texten gesungen.',
      'Ich hab noch nie jemandes Geburtstag vergessen.',
      'Ich hab noch nie extrem unter Klaustrophobie gelitten.',
      'Ich hab noch nie einem Fremden zugewinkt.',
    ],
    questionsNeverGirls: [
      'Ich hab noch nie meiner besten Freundin Beziehungsklatsch erzählt.',
      'Ich hab noch nie stundenlang Outfits ausgesucht, bevor ich fertig war.',
      'Ich hab noch nie heimlich einen Ex gestalkt.',
      'Ich hab noch nie den Lippenstift meiner Freundin ohne zu fragen benutzt.',
      'Ich hab noch nie Drama bei einem Mädelsabend gemacht.',
      'Ich hab noch nie vor meinem Freund ein anderes Mädchen erwähnt, um ihn eifersüchtig zu machen.',
      'Ich hab noch nie 30 Minuten auf der Toilette Fotos gemacht.',
      'Ich hab noch nie meinen Ex betrunken angerufen.',
      'Ich hab noch nie so getan, als würde ich schlafen, um nicht ans Handy zu gehen.',
      'Ich hab noch nie jemanden nur wegen der Aufmerksamkeit akzeptiert.',
      'Ich hab noch nie eine Notlüge erzählt, um jemanden nicht zu verletzen.',
      'Ich hab noch nie mich in jemanden verliebt, in den ich mich nicht verlieben sollte.',
      'Ich hab noch nie eine Situationship gehabt.',
      'Ich hab noch nie heimlich Gefühle für einen engen Freund gehabt.',
      'Ich hab noch nie jemand anderen benutzt, um eine Person eifersüchtig zu machen.',
      'Ich hab noch nie geweint, weil ich jemanden nicht vergessen konnte.',
      'Ich hab noch nie jemand anderen vermisst, während ich in einer Beziehung war.',
      'Ich hab noch nie jemandem von einem Fake-Account geschrieben.',
      'Ich hab noch nie den Ex meines Partners auf Social Media gestalkt.',
      'Ich hab noch nie versehentlich einen Screenshot an die falsche Person geschickt.',
      'Ich hab noch nie jemanden geghostet.',
      'Ich hab noch nie eine Beziehung weitergeführt, obwohl ich wusste, dass ich betrogen wurde.',
      'Ich hab noch nie aus Langeweile einen Streit angefangen.',
      'Ich hab noch nie geweint, um aus einer Situation rauszukommen.',
      'Ich hab noch nie jemandem geschrieben "Ruf mich an", nur um irgendwo zu entkommen.',
      'Ich hab noch nie jemanden geküsst, den ich nicht küssen wollte.',
      'Ich hab noch nie etwas getan, um meinen Partner eifersüchtig zu machen.',
      'Ich hab noch nie so getan, als wäre ich nicht eifersüchtig, obwohl ich es war.',
      'Ich hab noch nie direkt nach einer Trennung einen Rebound versucht.',
      'Ich hab noch nie auf jemandes Story mit einer Flamme reagiert.',
      'Ich hab noch nie mit meinem Partner über einen Freund gelästert.',
      'Ich hab noch nie eine Story nur für Trends gepostet.',
      'Ich hab noch nie mich nur wegen des Aussehens zu jemandem hingezogen gefühlt.',
      'Ich hab noch nie eine Obsession für jemanden gehabt.',
      'Ich hab noch nie das Haus ohne Make-up verlassen.',
      'Ich hab noch nie beim Serienglotzen geweint.',
      'Ich hab noch nie beim Shoppen mein Budget überschritten.',
      'Ich hab noch nie mit einer Freundin wegen eines Typen gestritten.',
      'Ich hab noch nie eine Story auf Social Media gepostet, um jemanden eifersüchtig zu machen.',
      'Ich hab noch nie behauptet, Diät zu machen, und heimlich genascht.',
      'Ich hab noch nie mit einem Typen geredet, nur um Aufmerksamkeit zu bekommen.',
      'Ich hab noch nie die neue Freundin meines Ex-Freundes gestalkt.',
      'Ich hab noch nie zu viel Geld für Beauty-Produkte ausgegeben.',
      'Ich hab noch nie einer Freundin erzählt, dass über sie gelästert wird.',
      'Ich hab noch nie absichtlich einem Typen spät geantwortet.',
      'Ich hab noch nie beim Mädelsabend zu viel getrunken.',
      'Ich hab noch nie einem Typen Andeutungen gemacht und darauf gewartet, dass er es versteht.',
      'Ich hab noch nie absichtlich ein auffälliges Outfit auf einer Party getragen.',
    ],
    questionsDareBasic: [
      'Lies die letzte Nachricht auf deinem Handy der Gruppe vor oder trink.',
      'Mach der Person gegenüber ein Kompliment oder trink.',
      'Halte 10 Sekunden Blickkontakt oder trink.',
      'Ruf die letzte Person an, die du angerufen hast, und sag Hallo oder trink.',
      'Erzähl deinen peinlichsten Moment oder trink.',
      'Mach die lustigste Imitation von jemandem in der Gruppe oder trink.',
      'Zeig das letzte Foto, das du mit deinem Handy gemacht hast, oder trink.',
      'Sag den Namen der Person, die du am meisten magst, oder trink.',
      'Schweige eine ganze Minute oder trink.',
      'Tanz oder trink.',
      'Lies deine letzte DM laut vor oder trink.',
      'Mach 30 Sekunden lang den Ententanz oder trink.',
      'Umarme die Person rechts neben dir oder trink.',
      'Erzähl, wann du das letzte Mal geweint hast, oder trink.',
      'Zeig deinen letzten Anruf auf dem Handy oder trink.',
      'Bewerte jemanden in der Gruppe von 1-10 oder trink.',
      'Versuche eine Minute lang nicht zu blinzeln oder trink.',
      'Schreib deinem besten Freund "Ich liebe dich" oder trink.',
      'Zeig das letzte Foto, das du auf Instagram geliked hast, oder trink.',
      'Erzähl einen Witz — wenn keiner lacht, trinkst du.',
      'Sag die beste Eigenschaft der Person gegenüber oder trink.',
      'Wähle die attraktivste Person in der Gruppe oder trink.',
      'Mach 20 Sekunden Plank oder trink.',
      'Beschreib die letzte Nachricht, die du gelöscht hast, oder trink.',
      'Ruf den letzten Kontakt in deinem Telefonbuch an oder trink.',
      'Zeig deinen peinlichsten Social-Media-Post oder trink.',
      'Sprich eine Minute lang mit Akzent oder trink.',
      'Imitiere jemanden in der Gruppe — wenn es niemand errät, trinkst du.',
      'Gestehe, wann du das letzte Mal gelogen hast, oder trink.',
      'Gib der Person links neben dir eine Aufgabe oder trink.',
      'Mach 10 Liegestütze vor allen oder trink.',
      'Gestehe deine seltsamste Angewohnheit oder trink.',
      'Sing den Refrain eines Liedes oder trink.',
      'Schreib deiner Mama jetzt "Ich hab dich so lieb" oder trink.',
      'Gib jemandem in der Gruppe einen Spitznamen oder trink.',
      'Mach ein Selfie mit der Person gegenüber oder trink.',
      'Zeig deinen letzten YouTube-Verlauf oder trink.',
      'Mach ein Tiergeräusch oder trink.',
      'Schreib mit geschlossenen Augen eine Nachricht und schick sie ab oder trink.',
      'Sag, welchen Promi du zuletzt gestalkt hast, oder trink.',
      'Zeig das älteste Foto auf deinem Handy oder trink.',
      'Zähle die besten 3 Eigenschaften von jemandem in der Gruppe auf oder trink.',
      'Sing 10 Sekunden lang dein Lieblingslied oder trink.',
      'Mach deine liebste Pose vor dem Spiegel oder trink.',
    ],
  },
};

const SCREENS = {
  HOME: "home",
  MODE_MAIN: "mode_main",
  MODE_NEVER_SUB: "mode_never_sub",
  LOBBY: "lobby",
  GAME: "game",
  SOLO_GAME: "solo_game",
  DARE_SETUP: "dare_setup",
};

const getServerUrl = () => {
  if (Platform.OS === "android") return "http://10.0.2.2:3003"; // Android emulator
  // Fiziksel cihazda test ediyorsan bilgisayarının local IP'sini yaz:
  // return "http://192.168.1.X:3003";
  return "http://localhost:3003";
};
const SERVER_URL = getServerUrl();

const CARD_FRAMES = {
  never_normal: require("./assets/card_questions.png"),
  never_girls: require("./assets/card_hearts.png"),
  dare_basic: require("./assets/card_party.png"),
  challenger: require("./assets/card_party.png"),
};


const CARD_TEXT_COLORS = {
  never_normal: { main: "#3B1845", counter: "#6B4C78" },
  never_girls:  { main: "#8B1A2B", counter: "#A0505E" },
  dare_basic:   { main: "#352060", counter: "#605080" },
  challenger:   { main: "#352060", counter: "#605080" },
};

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ── Twinkling Star ── */
function Star({ x, y, size, delay = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 1200 + Math.random() * 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1200 + Math.random() * 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.delay(Math.random() * 2000),
      ])
    ).start();
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.9] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.2] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#E9D5FF",
        opacity,
        transform: [{ scale }],
        shadowColor: "#C084FC",
        shadowOpacity: 0.8,
        shadowRadius: size * 2,
        shadowOffset: { width: 0, height: 0 },
      }}
    />
  );
}

/* ── Shooting Star ── */
function ShootingStar({ delay = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const shoot = () => {
      anim.setValue(0);
      Animated.sequence([
        Animated.delay(delay + Math.random() * 8000),
        Animated.timing(anim, { toValue: 1, duration: 700, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]).start(() => shoot());
    };
    shoot();
  }, []);

  const startX = Math.random() * SCREEN_WIDTH * 0.6;
  const startY = Math.random() * SCREEN_HEIGHT * 0.4;

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [startX, startX + SCREEN_WIDTH * 0.5] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [startY, startY + SCREEN_HEIGHT * 0.3] });
  const opacity = anim.interpolate({ inputRange: [0, 0.2, 0.7, 1], outputRange: [0, 0.8, 0.6, 0] });
  const scaleX = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0.3] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: 40,
        height: 2,
        borderRadius: 1,
        backgroundColor: "#D8B4FE",
        opacity,
        transform: [{ translateX }, { translateY }, { rotate: "35deg" }, { scaleX }],
        shadowColor: "#A855F7",
        shadowOpacity: 1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 0 },
      }}
    />
  );
}

/* ── Mor Yıldızlı Arka Plan ── */
const STARS = Array.from({ length: 35 }, (_, i) => ({
  id: i,
  x: Math.random() * SCREEN_WIDTH,
  y: Math.random() * SCREEN_HEIGHT,
  size: 1.5 + Math.random() * 3,
  delay: Math.random() * 4000,
}));

function PremiumBackground() {
  const nebulaAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(nebulaAnim, { toValue: 1, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(nebulaAnim, { toValue: 0, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const nebula1Opacity = nebulaAnim.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.25] });
  const nebula2Opacity = nebulaAnim.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.18] });
  const nebula1Scale = nebulaAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Koyu mor gradient arka plan */}
      <LinearGradient
        colors={["#0B0014", "#1A0533", "#0D0020", "#06000F"]}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Nebula glow'lar */}
      <Animated.View style={[styles.nebula, styles.nebula1, { opacity: nebula1Opacity, transform: [{ scale: nebula1Scale }] }]} />
      <Animated.View style={[styles.nebula, styles.nebula2, { opacity: nebula2Opacity }]} />
      <Animated.View style={[styles.nebula, styles.nebula3, { opacity: nebula1Opacity }]} />

      {/* Yıldızlar */}
      {STARS.map((s) => (
        <Star key={s.id} x={s.x} y={s.y} size={s.size} delay={s.delay} />
      ))}

      {/* Kayan yıldızlar */}
      <ShootingStar delay={2000} />
      <ShootingStar delay={7000} />
      <ShootingStar delay={12000} />
    </View>
  );
}

/* ── Error Boundary ── */
class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: "#09090B", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#F43F5E", fontSize: 18, fontWeight: "800" }}>{TRANSLATIONS[this.props.language || 'tr'].error.title}</Text>
          <Pressable onPress={() => this.setState({ hasError: false })} style={{ marginTop: 16 }}>
            <Text style={{ color: "#EC4899", fontSize: 16, fontWeight: "700" }}>{TRANSLATIONS[this.props.language || 'tr'].error.retry}</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

/* ── Toast with blur ── */
function Toast({ visible, message, type = "error", onHide }) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 16, useNativeDriver: true, speed: 14, bounciness: 8 }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 8 }),
      ]).start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      const t = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.9, duration: 250, useNativeDriver: true }),
        ]).start(() => onHide());
      }, 3000);
      return () => clearTimeout(t);
    } else {
      Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible, message]);
  return (
    <Animated.View style={[styles.toastContainer, { transform: [{ translateY }, { scale }] }]}>
      <BlurView intensity={40} tint="dark" style={styles.toastBlur}>
        <View style={styles.toastInner}>
          <View style={[styles.toastDot, type === "error" ? styles.toastDotError : styles.toastDotSuccess]} />
          <Text style={[styles.toastText, type === "error" && styles.toastTextError]}>{message}</Text>
        </View>
      </BlurView>
    </Animated.View>
  );
}

/* ── GlassCard wrapper ── */
function GlassCard({ children, style, intensity = 25 }) {
  return (
    <View style={[styles.glassOuter, style]}>
      <BlurView intensity={intensity} tint="dark" style={styles.glassBlur}>
        <View style={styles.glassInner}>
          {children}
        </View>
      </BlurView>
    </View>
  );
}

/* ── Premium GameButton ── */
function GameButton({ label, onPress, variant = "primary", disabled = false, icon }) {
  const scale = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (variant === "primary" && !disabled) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    }
  }, [variant, disabled]);

  const handlePressIn = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 24, bounciness: 12 }).start();
  };
  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start();
  };

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.7] });

  if (variant === "primary") {
    return (
      <Pressable onPress={disabled ? null : onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View style={[disabled && { opacity: 0.4 }, { transform: [{ scale }] }]}>
          {/* Glow behind button */}
          <Animated.View style={[styles.buttonGlow, { opacity: glowOpacity }]} />
          <LinearGradient
            colors={["#EC4899", "#A855F7", "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryButtonGradient}
          >
            <Text style={styles.primaryButtonText}>
              {icon ? `${icon}  ` : ""}{label}
            </Text>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={disabled ? null : onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.secondaryButton,
          disabled && { opacity: 0.4 },
          { transform: [{ scale }] },
        ]}
      >
        <Text style={styles.secondaryButtonText}>
          {icon ? `${icon}  ` : ""}{label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/* ── Shimmer Line Separator ── */
function ShimmerLine() {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);
  const translateX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH] });
  return (
    <View style={styles.shimmerLine}>
      <Animated.View style={[styles.shimmerGlow, { transform: [{ translateX }] }]} />
    </View>
  );
}

const SWIPE_THRESHOLD = 80;

/* ── GameCard ── */
function GameCard({ icon, children, modeId, questionKey, onSwipeLeft, onSwipeRight }) {
  const anim = useRef(new Animated.Value(0)).current;
  const swipeX = useRef(new Animated.Value(0)).current;
  const swiped = useRef(false);

  useEffect(() => {
    swiped.current = false;
    swipeX.setValue(0);
    anim.setValue(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [questionKey]);

  const onSwipeLeftRef = useRef(onSwipeLeft);
  const onSwipeRightRef = useRef(onSwipeRight);
  useEffect(() => {
    onSwipeLeftRef.current = onSwipeLeft;
    onSwipeRightRef.current = onSwipeRight;
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 15 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => { if (!swiped.current) swipeX.setValue(g.dx); },
      onPanResponderRelease: (_, g) => {
        if (swiped.current) return;
        if (g.dx < -SWIPE_THRESHOLD && onSwipeLeftRef.current) {
          swiped.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          Animated.timing(swipeX, { toValue: -SCREEN_WIDTH * 1.5, duration: 250, useNativeDriver: true }).start(() => onSwipeLeftRef.current());
        } else if (g.dx > SWIPE_THRESHOLD && onSwipeRightRef.current) {
          swiped.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          Animated.timing(swipeX, { toValue: SCREEN_WIDTH * 1.5, duration: 250, useNativeDriver: true }).start(() => onSwipeRightRef.current());
        } else {
          Animated.spring(swipeX, { toValue: 0, speed: 20, bounciness: 8, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  /* Kart çekme animasyonu - desteden kıvrılarak çıkıyor */
  const translateX = anim.interpolate({ inputRange: [0, 0.3, 0.6, 0.85, 1], outputRange: [SCREEN_WIDTH * 0.9, SCREEN_WIDTH * 0.25, -12, 4, 0] });
  const translateY = anim.interpolate({ inputRange: [0, 0.3, 0.6, 0.85, 1], outputRange: [60, 20, -8, 2, 0] });
  const rotateY = anim.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: ["-55deg", "-35deg", "-10deg", "4deg", "0deg"] });
  const rotateZ = anim.interpolate({ inputRange: [0, 0.3, 0.6, 0.85, 1], outputRange: ["-8deg", "-5deg", "-1deg", "0.5deg", "0deg"] });
  const scale = anim.interpolate({ inputRange: [0, 0.3, 0.7, 0.9, 1], outputRange: [0.75, 0.88, 0.98, 1.02, 1] });
  const opacity = anim.interpolate({ inputRange: [0, 0.1, 0.35], outputRange: [0, 0.6, 1], extrapolate: "clamp" });
  const skewY = anim.interpolate({ inputRange: [0, 0.3, 0.6, 1], outputRange: ["6deg", "3deg", "-1deg", "0deg"] });
  const swipeRotate = swipeX.interpolate({ inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH], outputRange: ["-15deg", "0deg", "15deg"] });

  const cardFrame = modeId && CARD_FRAMES[modeId] ? CARD_FRAMES[modeId] : null;
  const hasSwipe = onSwipeLeft || onSwipeRight;

  const cardContent = (
    <Animated.View style={[
      styles.questionHero,
      cardFrame && styles.questionHeroWithFrame,
      {
        opacity,
        transform: [
          { perspective: 800 },
          { translateX },
          { translateY },
          { rotateY },
          { rotateZ },
          { skewY },
          { scale },
        ]
      }
    ]}>
      {cardFrame ? (
        <ImageBackground
          source={cardFrame}
          style={styles.cardFrameImage}
          imageStyle={styles.cardFrameImageStyle}
          resizeMode="cover"
        >
          <View style={styles.cardFrameContent}>
            {children}
          </View>
        </ImageBackground>
      ) : (
        <View style={styles.questionCardInner}>
          {icon && (
            <View style={styles.questionCardTop}>
              <Text style={styles.questionIllustration}>{icon}</Text>
            </View>
          )}
          {children}
        </View>
      )}
    </Animated.View>
  );

  if (!hasSwipe) return cardContent;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{ transform: [{ translateX: swipeX }, { rotate: swipeRotate }] }}
    >
      {cardContent}
    </Animated.View>
  );
}

/* ── Player Avatar ── */
function PlayerAvatar({ name, index, isHost = false, onRemove }) {
  const colors = ["#EC4899", "#A855F7", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#6366F1", "#14B8A6"];
  const bgColor = colors[index % colors.length];
  const initial = name.charAt(0).toUpperCase();

  return (
    <View style={styles.playerAvatarRow}>
      <LinearGradient
        colors={[bgColor, `${bgColor}88`]}
        style={styles.playerAvatar}
      >
        <Text style={styles.playerAvatarText}>{initial}</Text>
      </LinearGradient>
      <View style={styles.playerAvatarInfo}>
        <Text style={styles.playerAvatarName}>{name}</Text>
        {isHost && (
          <View style={styles.hostBadge}>
            <Text style={styles.hostBadgeText}>HOST</Text>
          </View>
        )}
      </View>
      {onRemove ? (
        <Pressable onPress={onRemove} style={styles.removeBtn}>
          <Text style={styles.removeBtnText}>✕</Text>
        </Pressable>
      ) : (
        <View style={[styles.statusDot, { backgroundColor: "#22C55E" }]} />
      )}
    </View>
  );
}

/* ── Compact Player Chip (two-column grid) ── */
function PlayerChip({ name, index, onRemove }) {
  const colors = ["#EC4899", "#A855F7", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#6366F1", "#14B8A6"];
  const bgColor = colors[index % colors.length];
  const initial = name.charAt(0).toUpperCase();

  return (
    <View style={styles.playerChip}>
      <LinearGradient
        colors={[bgColor, `${bgColor}88`]}
        style={styles.playerChipAvatar}
      >
        <Text style={styles.playerChipAvatarText}>{initial}</Text>
      </LinearGradient>
      <Text style={styles.playerChipName} numberOfLines={1}>{name}</Text>
      {onRemove && (
        <Pressable onPress={onRemove} style={styles.playerChipRemove}>
          <Text style={styles.playerChipRemoveText}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

/* ── Language Toggle Component ── */
function LanguageToggle({ language, onSelect }) {
  const flags = { tr: '🇹🇷', en: '🇬🇧', de: '🇩🇪' };
  const labels = { tr: 'TR', en: 'EN', de: 'DE' };
  const langs = ['tr', 'en', 'de'];
  const [open, setOpen] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const toggleMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, speed: 20, bounciness: 12, useNativeDriver: true }),
    ]).start();
    if (open) {
      Animated.timing(menuAnim, { toValue: 0, duration: 150, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => setOpen(false));
    } else {
      setOpen(true);
      Animated.spring(menuAnim, { toValue: 1, speed: 16, bounciness: 8, useNativeDriver: true }).start();
    }
  };

  const pickLang = (lang) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onSelect(lang);
    Animated.timing(menuAnim, { toValue: 0, duration: 150, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => setOpen(false));
  };

  const menuOpacity = menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const menuTranslateY = menuAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] });
  const menuScale = menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });

  return (
    <View style={{ position: 'absolute', top: 60, right: 20, zIndex: 20, alignItems: 'flex-end' }}>
      <Pressable onPress={toggleMenu}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <BlurView intensity={30} tint="dark" style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, gap: 6 }}>
              <Text style={{ fontSize: 18 }}>{flags[language]}</Text>
              <Text style={{ color: '#A1A1AA', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 }}>{labels[language]}</Text>
            </View>
          </BlurView>
        </Animated.View>
      </Pressable>

      {open && (
        <Animated.View style={{ marginTop: 6, opacity: menuOpacity, transform: [{ translateY: menuTranslateY }, { scale: menuScale }] }}>
          <BlurView intensity={50} tint="dark" style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
            {langs.map((lang) => (
              <Pressable
                key={lang}
                onPress={() => pickLang(lang)}
                style={({ pressed }) => ({
                  flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 8,
                  backgroundColor: lang === language ? 'rgba(236,72,153,0.15)' : pressed ? 'rgba(255,255,255,0.05)' : 'transparent',
                })}
              >
                <Text style={{ fontSize: 20 }}>{flags[lang]}</Text>
                <Text style={{ color: lang === language ? '#F472B6' : '#A1A1AA', fontSize: 13, fontWeight: '700', width: 24 }}>{labels[lang]}</Text>
                {lang === language && <Text style={{ color: '#EC4899', fontSize: 14, fontWeight: '800' }}>✓</Text>}
              </Pressable>
            ))}
          </BlurView>
        </Animated.View>
      )}
    </View>
  );
}

/* ══════════════ MAIN APP ══════════════ */
function AppContent() {
  const socketRef = useRef(null);
  const revealX = useRef(new Animated.Value(400)).current;
  const cardAnim = useRef(new Animated.Value(1)).current;
  const setupTabAnim = useRef(new Animated.Value(0)).current;
  const dareResultAnim = useRef(new Animated.Value(0)).current;

  /* ── Language ── */
  const [language, setLanguage] = useState('tr');
  const languageRef = useRef('tr');

  const t = useCallback((key) => {
    const keys = key.split('.');
    let val = TRANSLATIONS[languageRef.current];
    for (const k of keys) {
      if (!val || typeof val !== 'object') return key;
      val = val[k];
    }
    return val !== undefined ? val : key;
  }, []);

  const changeLanguage = useCallback((lang) => {
    languageRef.current = lang;
    setLanguage(lang);
    SafeStorage.setItem('shotic_language', lang).catch(() => {});
  }, []);

  useEffect(() => {
    SafeStorage.getItem('shotic_language').then((saved) => {
      if (saved && TRANSLATIONS[saved]) {
        languageRef.current = saved;
        setLanguage(saved);
      }
    }).catch(() => {});
  }, []);

  const [screen, setScreenRaw] = useState(SCREENS.HOME);
  const screenRef = useRef(SCREENS.HOME);
  const setScreen = (s) => { screenRef.current = s; setScreenRaw(s); };
  const isNavigating = useRef(false);
  const [playerName, setPlayerName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [setupTab, setSetupTab] = useState("create");
  const [setupPanelWidth, setSetupPanelWidth] = useState(0);

  const [selectedMode, setSelectedMode] = useState(null);
  const [activeRoomCode, setActiveRoomCode] = useState("");
  const [modeId, setModeId] = useState(null);
  const [modeLabel, setModeLabel] = useState(null);
  const [modeType, setModeType] = useState(null);
  const [ownerId, setOwnerIdRaw] = useState(null);
  const ownerIdRef = useRef(null);
  const setOwnerId = (v) => { ownerIdRef.current = v; setOwnerIdRaw(v); };
  const [myId, setMyIdRaw] = useState(null);
  const myIdRef = useRef(null);
  const setMyId = (v) => { myIdRef.current = v; setMyIdRaw(v); };
  const [players, setPlayers] = useState([]);
  const [playerEntries, setPlayerEntries] = useState([]);
  const [phase, setPhase] = useState("lobby");
  const [question, setQuestion] = useState("");
  const [questionType, setQuestionType] = useState(null);
  const [answersCount, setAnswersCount] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [currentResult, setCurrentResult] = useState(null);
  const [revealStep, setRevealStep] = useState(0);
  const [currentTurnPlayerName, setCurrentTurnPlayerName] = useState(null);
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [revealItem, setRevealItem] = useState(null);

  const [selectedVoteTarget, setSelectedVoteTarget] = useState(null);
  const [inputNumber, setInputNumber] = useState("");
  const [questionNum, setQuestionNum] = useState(0);

  const [soloModeId, setSoloModeId] = useState(null);
  const [soloQuestions, setSoloQuestions] = useState([]);
  const [soloQuestionIndex, setSoloQuestionIndex] = useState(0);
  const [soloCurrentQuestion, setSoloCurrentQuestion] = useState("");

  const [darePlayerNames, setDarePlayerNames] = useState([]);
  const [dareNameInput, setDareNameInput] = useState("");
  const [currentDarePlayer, setCurrentDarePlayer] = useState("");

  const [toast, setToast] = useState({ visible: false, message: "", type: "error" });
  const showToast = useCallback((msg, type = "error") => setToast({ visible: true, message: msg, type }), []);
  const hideToast = useCallback(() => setToast((p) => ({ ...p, visible: false })), []);

  const isOwner = !!myId && myId === ownerId;
  const isNever = modeType === "never";
  const isDareBasic = modeType === "dare_basic";
  const isChallenger = modeType === "dare";
  const isMyTurn = !!myId && myId === currentTurnPlayerId;

  /* ── navigation ── */
  const navigateTo = (next) => {
    if (next === screenRef.current || isNavigating.current) return;
    isNavigating.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.timing(cardAnim, {
      toValue: 0,
      duration: 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setScreen(next);
      Animated.spring(cardAnim, {
        toValue: 1,
        speed: 16,
        bounciness: 4,
        useNativeDriver: true,
      }).start(() => { isNavigating.current = false; });
    });
  };

  /* ── reveal sequence (never mode) ── */
  const autoNextTimerRef = useRef(null);

  const runRevealSequence = (sequence) => {
    if (!sequence?.length) return setRevealItem(null);
    let i = 0;
    const next = () => {
      if (i >= sequence.length) {
        setRevealItem(null);
        autoNextTimerRef.current = setTimeout(() => {
          if (myIdRef.current && myIdRef.current === ownerIdRef.current) {
            socketRef.current?.emit("next_question");
          }
        }, 500);
        return;
      }
      const item = sequence[i++];
      setRevealItem(item);
      revealX.setValue(360);
      Animated.sequence([
        Animated.timing(revealX, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.delay(450),
        Animated.timing(revealX, { toValue: -360, duration: 320, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]).start(next);
    };
    next();
  };

  /* ── dare result bounce animation ── */
  const revealStepTimerRef = useRef(null);

  const animateDareResult = () => {
    setRevealStep(1);
    dareResultAnim.setValue(0);
    Animated.spring(dareResultAnim, { toValue: 1, speed: 8, bounciness: 14, useNativeDriver: true }).start();
  };

  useEffect(() => {
    if (!currentResult || phase !== "reveal") return;
    const hasTwoParts = currentResult.includes("|");
    if (hasTwoParts) {
      revealStepTimerRef.current = setTimeout(() => {
        setRevealStep(2);
        autoNextTimerRef.current = setTimeout(() => {
          if (myIdRef.current && myIdRef.current === ownerIdRef.current) {
            socketRef.current?.emit("next_question");
          }
        }, 1500);
      }, 1500);
    } else {
      autoNextTimerRef.current = setTimeout(() => {
        if (myIdRef.current && myIdRef.current === ownerIdRef.current) {
          socketRef.current?.emit("next_question");
        }
      }, 1000);
    }
    return () => {
      if (revealStepTimerRef.current) { clearTimeout(revealStepTimerRef.current); revealStepTimerRef.current = null; }
    };
  }, [currentResult, phase]);

  /* ── socket setup ── */
  useEffect(() => {
    const socket = io(SERVER_URL, {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;
    socket.on("connect", () => {
      console.log("[socket] connected:", socket.id);
      setMyId(socket.id);
    });
    socket.on("connect_error", (err) => {
      console.log("[socket] connect_error:", err.message);
      showToast(t('toast.connectionError'));
    });
    socket.on("disconnect", (reason) => {
      console.log("[socket] disconnected:", reason);
      if (reason !== "io client disconnect") {
        showToast(t('toast.disconnected'));
      }
    });
    socket.io.on("reconnect", () => {
      console.log("[socket] reconnected:", socket.id);
      setMyId(socket.id);
      showToast(t('toast.reconnected'), "success");
    });
    socket.io.on("reconnect_failed", () => {
      showToast(t('toast.connectionFailed'));
    });

    const applyState = (payload) => {
      setActiveRoomCode(payload.roomCode || "");
      setModeId(payload.modeId || null);
      setModeLabel(payload.modeLabel || null);
      setModeType(payload.modeType || null);
      setOwnerId(payload.ownerId || null);
      setPlayers(payload.players || []);
      setPlayerEntries(payload.playerEntries || []);
      setPhase(payload.phase || "lobby");
      setQuestion(payload.currentQuestion || "");
      setQuestionType(payload.currentQuestionType || null);
      if (payload.currentQuestion && payload.phase === "question") {
        setQuestionNum((prev) => prev + 1);
      }
      setAnswersCount(payload.answersCount || 0);
      setTotalPlayers(payload.totalPlayers || 0);
      setCurrentResult(payload.currentResult || null);
      setCurrentTurnPlayerName(payload.currentTurnPlayerName || null);
      setCurrentTurnPlayerId(payload.currentTurnPlayerId || null);
    };

    socket.on("room_joined", (payload) => {
      applyState(payload);
      navigateTo(SCREENS.LOBBY);
    });

    socket.on("room_state", (payload) => {
      if (autoNextTimerRef.current) { clearTimeout(autoNextTimerRef.current); autoNextTimerRef.current = null; }
      if (revealStepTimerRef.current) { clearTimeout(revealStepTimerRef.current); revealStepTimerRef.current = null; }
      applyState(payload);
      if (payload.phase === "reveal" && payload.currentResult) animateDareResult();
      if (payload.phase === "question") {
        setRevealStep(0);
        setSelectedVoteTarget(null);
        setInputNumber("");
      }
    });

    socket.on("reveal_sequence", ({ sequence }) => {
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
        autoNextTimerRef.current = null;
      }
      runRevealSequence(sequence || []);
    });
    socket.on("room_error", ({ message }) => showToast(message || t('toast.genericError')));

    return () => socket.disconnect();
  }, []);

  /* ── tab animation ── */
  useEffect(() => {
    Animated.timing(setupTabAnim, { toValue: setupTab === "join" ? 1 : 0, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [setupTab]);

  /* ── actions ── */
  const createRoom = () => {
    if (!playerName.trim()) return showToast(t('toast.nameRequired'));
    if (!selectedMode) return showToast(t('toast.selectMode'));
    socketRef.current?.emit("create_room", {
      playerName: playerName.trim(),
      modeId: selectedMode.id,
      modeLabel: selectedMode.label,
      language: languageRef.current,
    });
  };

  const joinRoom = () => {
    if (!playerName.trim()) return showToast(t('toast.nameRequired'));
    if (!roomCodeInput.trim()) return showToast(t('toast.enterCode'));
    socketRef.current?.emit("join_room", { playerName: playerName.trim(), roomCode: roomCodeInput.trim().toUpperCase(), language: languageRef.current });
  };

  const leaveRoom = () => {
    socketRef.current?.emit("leave_room");
    setSelectedMode(null);
    setModeLabel(null);
    setQuestion("");
    setRevealItem(null);
    setCurrentResult(null);
    navigateTo(SCREENS.HOME);
  };

  const startGame = () => socketRef.current?.emit("start_game");
  const submitAnswer = (answer) => socketRef.current?.emit("submit_answer", { answer });
  const submitVote = () => { if (selectedVoteTarget) socketRef.current?.emit("submit_vote", { targetId: selectedVoteTarget }); };
  const submitInput = () => { if (inputNumber) socketRef.current?.emit("submit_input", { value: Number(inputNumber) }); };
  const submitTarget = (targetId) => socketRef.current?.emit("submit_target", { targetId });
  const forceReveal = () => socketRef.current?.emit("force_reveal");
  const nextQuestion = () => socketRef.current?.emit("next_question");

  const copyCode = async () => {
    if (!activeRoomCode) return;
    await Clipboard.setStringAsync(activeRoomCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const selectMode = (mode) => {
    if (mode.id === "never_normal" || mode.id === "never_girls") {
      startSoloGame(mode);
    } else if (mode.id === "dare_basic") {
      setSelectedMode(mode);
      setModeLabel(mode.label);
      setDarePlayerNames([]);
      setDareNameInput("");
      navigateTo(SCREENS.DARE_SETUP);
    } else {
      setSelectedMode(mode);
      navigateTo(SCREENS.HOME);
    }
  };

  const getSoloQuestions = useCallback((id) => {
    const lang = TRANSLATIONS[languageRef.current];
    if (id === 'never_normal') return lang.questionsNeverNormal || [];
    if (id === 'never_girls') return lang.questionsNeverGirls || [];
    if (id === 'dare_basic') return lang.questionsDareBasic || [];
    return [];
  }, []);

  const startSoloGame = (mode) => {
    const questions = getSoloQuestions(mode.id);
    if (!questions.length) {
      showToast(t('toast.noQuestions'));
      return;
    }
    const shuffled = shuffleArray(questions);
    setSoloModeId(mode.id);
    setModeLabel(mode.label);
    setSoloQuestions(shuffled);
    setSoloQuestionIndex(0);
    setSoloCurrentQuestion(shuffled[0]);
    setQuestionNum(1);
    navigateTo(SCREENS.SOLO_GAME);
  };

  const nextSoloQuestion = () => {
    const nextIndex = (soloQuestionIndex + 1) % soloQuestions.length;
    setSoloQuestionIndex(nextIndex);
    setSoloCurrentQuestion(soloQuestions[nextIndex]);
    setQuestionNum((prev) => prev + 1);
  };

  const exitSoloGame = () => {
    setSoloModeId(null);
    setSoloQuestions([]);
    setSoloQuestionIndex(0);
    setSoloCurrentQuestion("");
    setQuestionNum(0);
    setModeLabel(null);
    navigateTo(SCREENS.MODE_NEVER_SUB);
  };

  const addDarePlayer = () => {
    const name = dareNameInput.trim();
    if (!name) {
      showToast(t('toast.emptyName'));
      return;
    }
    if (darePlayerNames.includes(name)) {
      showToast(t('toast.duplicateName'));
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setDarePlayerNames([...darePlayerNames, name]);
    setDareNameInput("");
  };

  const removeDarePlayer = (index) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setDarePlayerNames(darePlayerNames.filter((_, i) => i !== index));
  };

  const startDareGame = () => {
    if (darePlayerNames.length < 2) {
      showToast(t('toast.minPlayers'));
      return;
    }
    const questions = getSoloQuestions('dare_basic');
    if (!questions.length) {
      showToast(t('toast.noQuestions'));
      return;
    }
    const shuffled = shuffleArray(questions);
    setSoloModeId("dare_basic");
    setSoloQuestions(shuffled);
    setSoloQuestionIndex(0);
    setSoloCurrentQuestion(shuffled[0]);
    setQuestionNum(1);
    const randomPlayer = darePlayerNames[Math.floor(Math.random() * darePlayerNames.length)];
    setCurrentDarePlayer(randomPlayer);
    navigateTo(SCREENS.SOLO_GAME);
  };

  const nextDareQuestion = () => {
    const nextIndex = (soloQuestionIndex + 1) % soloQuestions.length;
    setSoloQuestionIndex(nextIndex);
    setSoloCurrentQuestion(soloQuestions[nextIndex]);
    setQuestionNum((prev) => prev + 1);
    const randomPlayer = darePlayerNames[Math.floor(Math.random() * darePlayerNames.length)];
    setCurrentDarePlayer(randomPlayer);
  };

  const exitDareGame = () => {
    setSoloModeId(null);
    setSoloQuestions([]);
    setSoloQuestionIndex(0);
    setSoloCurrentQuestion("");
    setQuestionNum(0);
    setCurrentDarePlayer("");
    setModeLabel(null);
    navigateTo(SCREENS.DARE_SETUP);
  };

  /* ── interpolations ── */
  const setupSlideX = setupTabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -(setupPanelWidth || 1)] });
  const setupCreateOpacity = setupTabAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] });
  const setupJoinOpacity = setupTabAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });
  const cardOpacity = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const cardTranslateY = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });
  const cardScale = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] });
  const dareResultScale = dareResultAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.92, 1.06, 1] });

  /* ── determine card style ── */
  const useCompactCard = screen === SCREENS.HOME || screen === SCREENS.MODE_MAIN || screen === SCREENS.MODE_NEVER_SUB || screen === SCREENS.DARE_SETUP;
  const useLobbyCard = screen === SCREENS.LOBBY;

  /* ── header text ── */
  const headerTitle = (() => {
    if (screen === SCREENS.HOME) return t('home.title');
    if (screen === SCREENS.MODE_MAIN) return t('modes.title');
    if (screen === SCREENS.MODE_NEVER_SUB) return t('modes.selectVersion');
    if (screen === SCREENS.DARE_SETUP) return t('dareSetup.title');
    if (screen === SCREENS.LOBBY) return t('lobby.title');
    if (screen === SCREENS.GAME) return modeLabel || t('game.title');
    if (screen === SCREENS.SOLO_GAME) return modeLabel || t('game.title');
    return "";
  })();

  const headerSubtitle = (() => {
    if (screen === SCREENS.HOME) return selectedMode ? selectedMode.label : t('home.subtitle');
    if (screen === SCREENS.MODE_MAIN) return t('modes.subtitle');
    if (screen === SCREENS.MODE_NEVER_SUB) return t('modes.selectVersionSub');
    if (screen === SCREENS.DARE_SETUP) return t('format.readyCount')(darePlayerNames.length);
    if (screen === SCREENS.LOBBY) return t('format.waitingCount')(players.length);
    if (screen === SCREENS.GAME && phase === "question") return t('format.answerCount')(answersCount, totalPlayers);
    if (screen === SCREENS.GAME && phase === "reveal") return t('game.results');
    if (screen === SCREENS.SOLO_GAME) return t('format.swipeHint');
    return "";
  })();

  /* ── render content ── */
  const renderCardContent = () => {
    /* ── HOME ── */
    if (screen === SCREENS.HOME) {
      return (
        <View style={styles.stack}>
          <Pressable
            style={[styles.modeOption, selectedMode && styles.modeOptionActive]}
            onPress={() => navigateTo(SCREENS.MODE_MAIN)}
          >
            <View style={styles.modeOptionLeft}>
              <Text style={styles.modeOptionIcon}>{selectedMode ? "✓" : "+"}</Text>
              <Text style={[styles.modeOptionText, selectedMode && styles.modeOptionTextActive]}>
                {selectedMode ? selectedMode.label : t('home.selectMode')}
              </Text>
            </View>
            <Text style={{ color: "#71717A", fontSize: 20 }}>›</Text>
          </Pressable>

          {selectedMode && (
            <>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>{t('home.yourName')}</Text>
                <TextInput
                  placeholder={t('home.namePlaceholder')}
                  placeholderTextColor="#52525B"
                  value={playerName}
                  onChangeText={setPlayerName}
                  style={styles.input}
                />
              </View>

              <View style={styles.segmentWrap}>
                <Pressable style={[styles.segmentButton, setupTab === "create" && styles.segmentButtonActive]} onPress={() => setSetupTab("create")}>
                  {setupTab === "create" ? (
                    <LinearGradient colors={["#EC4899", "#A855F7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.segmentGradient}>
                      <Text style={styles.segmentTextActive}>{t('home.createRoom')}</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.segmentText}>{t('home.createRoom')}</Text>
                  )}
                </Pressable>
                <Pressable style={[styles.segmentButton, setupTab === "join" && styles.segmentButtonActive]} onPress={() => setSetupTab("join")}>
                  {setupTab === "join" ? (
                    <LinearGradient colors={["#EC4899", "#A855F7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.segmentGradient}>
                      <Text style={styles.segmentTextActive}>{t('home.joinRoom')}</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.segmentText}>{t('home.joinRoom')}</Text>
                  )}
                </Pressable>
              </View>

              <View style={styles.panelViewport} onLayout={(e) => setSetupPanelWidth(e.nativeEvent.layout.width)}>
                <Animated.View style={[styles.panelTrack, { width: (setupPanelWidth || 1) * 2, transform: [{ translateX: setupSlideX }] }]}>
                  <Animated.View style={[styles.panelPage, { width: setupPanelWidth || 1, opacity: setupCreateOpacity }]}>
                    <GameButton label={t('home.newRoom')} onPress={createRoom} />
                  </Animated.View>
                  <Animated.View style={[styles.panelPage, { width: setupPanelWidth || 1, opacity: setupJoinOpacity }]}>
                    <View style={styles.stack}>
                      <TextInput
                        placeholder={t('home.roomCode')}
                        placeholderTextColor="#52525B"
                        value={roomCodeInput}
                        onChangeText={(v) => setRoomCodeInput(v.toUpperCase())}
                        style={styles.input}
                      />
                      <GameButton label={t('home.joinRoom')} onPress={joinRoom} variant="secondary" />
                    </View>
                  </Animated.View>
                </Animated.View>
              </View>
            </>
          )}
        </View>
      );
    }

    /* ── MODE MAIN ── */
    if (screen === SCREENS.MODE_MAIN) {
      return (
        <View style={styles.stack}>
          <Pressable style={styles.modeCard} onPress={() => navigateTo(SCREENS.MODE_NEVER_SUB)}>
            <LinearGradient colors={["rgba(236,72,153,0.15)", "rgba(168,85,247,0.08)"]} style={styles.modeCardGlow} />
            <Text style={styles.modeCardEmoji}>🤝</Text>
            <View style={styles.modeCardTextWrap}>
              <Text style={styles.modeCardTitle}>{t('modes.neverTitle')}</Text>
              <Text style={styles.modeCardDesc}>{t('modes.neverDesc')}</Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.modeCard}
            onPress={() => selectMode({ id: "dare_basic", label: t('modes.dareLabel') })}
          >
            <LinearGradient colors={["rgba(251,146,60,0.15)", "rgba(236,72,153,0.08)"]} style={styles.modeCardGlow} />
            <Text style={styles.modeCardEmoji}>🍺</Text>
            <View style={styles.modeCardTextWrap}>
              <Text style={styles.modeCardTitle}>{t('modes.dareTitle')}</Text>
              <Text style={styles.modeCardDesc}>{t('modes.dareDesc')}</Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.modeCard}
            onPress={() => selectMode({ id: "challenger", label: t('modes.challengerLabel') })}
          >
            <LinearGradient colors={["rgba(6,182,212,0.15)", "rgba(99,102,241,0.08)"]} style={styles.modeCardGlow} />
            <Text style={styles.modeCardEmoji}>⚡</Text>
            <View style={styles.modeCardTextWrap}>
              <Text style={styles.modeCardTitle}>{t('modes.challengerTitle')}</Text>
              <Text style={styles.modeCardDesc}>{t('modes.challengerDesc')}</Text>
            </View>
          </Pressable>
        </View>
      );
    }

    /* ── DARE SETUP ── */
    if (screen === SCREENS.DARE_SETUP) {
      return (
        <View style={styles.stack}>
          {/* Input + Add - always visible at top */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>{t('dareSetup.playerName')}</Text>
            <View style={styles.inputRow}>
              <TextInput
                placeholder={t('dareSetup.namePlaceholder')}
                placeholderTextColor="#52525B"
                value={dareNameInput}
                onChangeText={setDareNameInput}
                onSubmitEditing={addDarePlayer}
                style={[styles.input, styles.inputFlex]}
                returnKeyType="done"
              />
              <Pressable style={styles.addBtn} onPress={addDarePlayer}>
                <LinearGradient
                  colors={["#A855F7", "#EC4899"]}
                  style={styles.addBtnGradient}
                >
                  <Text style={styles.addBtnText}>+</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>

          {/* Player grid - scrollable */}
          <GlassCard style={{ maxHeight: SCREEN_HEIGHT * 0.38 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>{t('dareSetup.players')}</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{darePlayerNames.length}</Text>
              </View>
            </View>
            <ShimmerLine />
            {darePlayerNames.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>👥</Text>
                <Text style={styles.emptyStateText}>{t('dareSetup.noPlayers')}</Text>
                <Text style={styles.emptyStateHint}>{t('dareSetup.addHint')}</Text>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: SCREEN_HEIGHT * 0.28 }}
                contentContainerStyle={styles.playerGrid}
              >
                {darePlayerNames.map((name, idx) => (
                  <PlayerChip
                    key={idx}
                    name={name}
                    index={idx}
                    onRemove={() => removeDarePlayer(idx)}
                  />
                ))}
              </ScrollView>
            )}
          </GlassCard>

          {/* Action buttons - always visible at bottom */}
          <GameButton
            label={t('dareSetup.startGame')}
            onPress={startDareGame}
            disabled={darePlayerNames.length < 2}
          />
        </View>
      );
    }

    /* ── MODE NEVER SUB ── */
    if (screen === SCREENS.MODE_NEVER_SUB) {
      return (
        <View style={styles.stack}>
          <Pressable
            style={styles.modeCard}
            onPress={() => selectMode({ id: "never_normal", label: t('modes.neverNormalLabel') })}
          >
            <LinearGradient colors={["rgba(168,85,247,0.15)", "rgba(99,102,241,0.08)"]} style={styles.modeCardGlow} />
            <Text style={styles.modeCardEmoji}>🎯</Text>
            <View style={styles.modeCardTextWrap}>
              <Text style={styles.modeCardTitle}>{t('modes.normalTitle')}</Text>
              <Text style={styles.modeCardDesc}>{t('modes.normalDesc')}</Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.modeCard}
            onPress={() => selectMode({ id: "never_girls", label: t('modes.neverGirlsLabel') })}
          >
            <LinearGradient colors={["rgba(236,72,153,0.15)", "rgba(244,114,182,0.08)"]} style={styles.modeCardGlow} />
            <Text style={styles.modeCardEmoji}>💕</Text>
            <View style={styles.modeCardTextWrap}>
              <Text style={styles.modeCardTitle}>{t('modes.girlsTitle')}</Text>
              <Text style={styles.modeCardDesc}>{t('modes.girlsDesc')}</Text>
            </View>
          </Pressable>
        </View>
      );
    }

    /* ── LOBBY ── */
    if (screen === SCREENS.LOBBY) {
      return (
        <View style={styles.stack}>
          <GlassCard>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>{t('lobby.roomCode')}</Text>
              <Pressable style={styles.copyBtn} onPress={copyCode}>
                <LinearGradient
                  colors={copied ? ["#22C55E", "#16A34A"] : ["#3F3F46", "#27272A"]}
                  style={styles.copyBtnGradient}
                >
                  <Text style={styles.copyBtnIcon}>{copied ? "✓" : "⧉"}</Text>
                </LinearGradient>
              </Pressable>
            </View>
            <Text style={styles.lobbyCode}>{activeRoomCode}</Text>
            <Text style={styles.lobbyHint}>{t('lobby.shareHint')}</Text>
          </GlassCard>

          <GlassCard>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>{t('lobby.players')}</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{players.length}</Text>
              </View>
            </View>
            <ShimmerLine />
            {players.map((name, idx) => (
              <PlayerAvatar key={`${name}-${idx}`} name={name} index={idx} isHost={idx === 0} />
            ))}
          </GlassCard>

          {isOwner && (
            <GameButton label={t('lobby.startGame')} onPress={startGame} />
          )}

          {!isOwner && (
            <View style={styles.waitingBox}>
              <Text style={styles.waitingDots}>...</Text>
              <Text style={styles.waitingText}>{t('lobby.waitingHost')}</Text>
            </View>
          )}
        </View>
      );
    }

    /* ── SOLO GAME ── */
    if (screen === SCREENS.SOLO_GAME) {
      const isDareMode = soloModeId === "dare_basic";

      return (
        <View style={styles.gameStack}>
          {isDareMode && currentDarePlayer && (
            <View style={styles.turnBadge}>
              <LinearGradient colors={["rgba(6,182,212,0.2)", "rgba(99,102,241,0.15)"]} style={styles.turnBadgeGradient}>
                <Text style={styles.turnBadgeLabel}>{t('game.turn')}</Text>
                <Text style={styles.turnBadgeName}>{currentDarePlayer}</Text>
              </LinearGradient>
            </View>
          )}

          <GameCard
            icon={isDareMode ? "🍺" : "🤝"}
            modeId={soloModeId}
            questionKey={soloCurrentQuestion}
            onSwipeLeft={isDareMode ? nextDareQuestion : nextSoloQuestion}
            onSwipeRight={isDareMode ? nextDareQuestion : nextSoloQuestion}
          >
            <Text style={[
              isDareMode ? styles.questionTextDare : styles.questionTextNever,
              soloModeId && CARD_FRAMES[soloModeId] && styles.questionTextOnFrame,
              CARD_TEXT_COLORS[soloModeId] && { color: CARD_TEXT_COLORS[soloModeId].main }
            ]}>
              {soloCurrentQuestion}
            </Text>
            {questionNum > 0 && (
              <Text style={[
                styles.questionCounter,
                soloModeId && CARD_FRAMES[soloModeId] && styles.questionCounterOnFrame,
                CARD_TEXT_COLORS[soloModeId] && { color: CARD_TEXT_COLORS[soloModeId].counter }
              ]}>
                {t('format.question')(questionNum)}
              </Text>
            )}
          </GameCard>
          <View style={styles.swipeHintWrap}>
            <View style={styles.swipeArrow}><Text style={styles.swipeArrowText}>←</Text></View>
            <Text style={styles.swipeHint}>{t('game.swipe')}</Text>
            <View style={styles.swipeArrow}><Text style={styles.swipeArrowText}>→</Text></View>
          </View>
        </View>
      );
    }

    /* ── GAME (Multiplayer) ── */
    if (screen === SCREENS.GAME) {
      return (
        <View style={styles.gameStack}>
          {isNever && phase === "question" && (
            <>
              <GameCard
                icon="🤝"
                modeId={modeId}
                questionKey={question}
                onSwipeLeft={() => nextQuestion()}
                onSwipeRight={() => nextQuestion()}
              >
                <Text style={[styles.questionTextNever, modeId && CARD_FRAMES[modeId] && styles.questionTextOnFrame, CARD_TEXT_COLORS[modeId] && { color: CARD_TEXT_COLORS[modeId].main }]}>{question}</Text>
                {questionNum > 0 && <Text style={[styles.questionCounter, modeId && CARD_FRAMES[modeId] && styles.questionCounterOnFrame, CARD_TEXT_COLORS[modeId] && { color: CARD_TEXT_COLORS[modeId].counter }]}>{t('format.question')(questionNum)}</Text>}
              </GameCard>
              <View style={styles.swipeHintWrap}>
                <View style={styles.swipeArrow}><Text style={styles.swipeArrowText}>←</Text></View>
                <Text style={styles.swipeHint}>{t('game.swipe')}</Text>
                <View style={styles.swipeArrow}><Text style={styles.swipeArrowText}>→</Text></View>
              </View>
            </>
          )}

          {isNever && phase === "reveal" && revealItem && (
            <GlassCard>
              <Text style={styles.sectionLabel}>{t('game.results')}</Text>
              <ShimmerLine />
              <View style={styles.revealStage}>
                <Animated.Text style={[styles.revealText, { transform: [{ translateX: revealX }] }]}>
                  {revealItem.name}: {revealItem.answer === "did" ? t('game.did') : t('game.didNot')}
                </Animated.Text>
              </View>
            </GlassCard>
          )}

          {isDareBasic && phase === "question" && (
            <>
              {currentTurnPlayerName && (
                <View style={styles.turnBadge}>
                  <LinearGradient colors={["rgba(6,182,212,0.2)", "rgba(99,102,241,0.15)"]} style={styles.turnBadgeGradient}>
                    <Text style={styles.turnBadgeLabel}>{t('game.turn')}</Text>
                    <Text style={styles.turnBadgeName}>{currentTurnPlayerName}</Text>
                  </LinearGradient>
                </View>
              )}

              <GameCard
                icon="🍺"
                modeId={modeId}
                questionKey={question}
                onSwipeLeft={() => nextQuestion()}
                onSwipeRight={() => nextQuestion()}
              >
                <Text style={[styles.questionTextDare, modeId && CARD_FRAMES[modeId] && styles.questionTextOnFrame, CARD_TEXT_COLORS[modeId] && { color: CARD_TEXT_COLORS[modeId].main }]}>{question}</Text>
                {questionNum > 0 && <Text style={[styles.questionCounter, modeId && CARD_FRAMES[modeId] && styles.questionCounterOnFrame, CARD_TEXT_COLORS[modeId] && { color: CARD_TEXT_COLORS[modeId].counter }]}>{t('format.question')(questionNum)}</Text>}
              </GameCard>
              <View style={styles.swipeHintWrap}>
                <View style={styles.swipeArrow}><Text style={styles.swipeArrowText}>←</Text></View>
                <Text style={styles.swipeHint}>{t('game.swipe')}</Text>
                <View style={styles.swipeArrow}><Text style={styles.swipeArrowText}>→</Text></View>
              </View>
            </>
          )}

          {isChallenger && phase === "question" && (
            <>
              {currentTurnPlayerName && (
                <View style={styles.turnBadge}>
                  <LinearGradient colors={["rgba(6,182,212,0.2)", "rgba(99,102,241,0.15)"]} style={styles.turnBadgeGradient}>
                    <Text style={styles.turnBadgeLabel}>{t('game.turn')}</Text>
                    <Text style={styles.turnBadgeName}>{currentTurnPlayerName}</Text>
                  </LinearGradient>
                </View>
              )}

              <GameCard icon="⚡" modeId={modeId} questionKey={question}>
                <Text style={[styles.questionTextDare, modeId && CARD_FRAMES[modeId] && styles.questionTextOnFrame, CARD_TEXT_COLORS[modeId] && { color: CARD_TEXT_COLORS[modeId].main }]}>{question}</Text>
                {questionNum > 0 && <Text style={[styles.questionCounter, modeId && CARD_FRAMES[modeId] && styles.questionCounterOnFrame, CARD_TEXT_COLORS[modeId] && { color: CARD_TEXT_COLORS[modeId].counter }]}>{t('format.question')(questionNum)}</Text>}
              </GameCard>

              {questionType === "vote" && (
                <GlassCard>
                  <Text style={styles.sectionLabel}>{t('game.vote')}</Text>
                  <ShimmerLine />
                  {playerEntries.map((p) => (
                    <Pressable
                      key={p.id}
                      style={[styles.modeOption, selectedVoteTarget === p.id && styles.modeOptionActive]}
                      onPress={() => setSelectedVoteTarget(p.id)}
                    >
                      <View style={styles.modeOptionLeft}>
                        <Text style={styles.modeOptionIcon}>{selectedVoteTarget === p.id ? "✓" : ""}</Text>
                        <Text style={[styles.modeOptionText, selectedVoteTarget === p.id && styles.modeOptionTextActive]}>
                          {p.name}{p.id === myId ? ` ${t('game.me')}` : ""}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                  <GameButton label={t('game.submitVote')} onPress={submitVote} disabled={!selectedVoteTarget} />
                </GlassCard>
              )}

              {questionType === "input_number" && (
                <GlassCard>
                  <Text style={styles.sectionLabel}>{t('game.enterNumber')}</Text>
                  <ShimmerLine />
                  <TextInput
                    placeholder="0"
                    placeholderTextColor="#52525B"
                    value={inputNumber}
                    onChangeText={setInputNumber}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                  <GameButton label={t('game.submit')} onPress={submitInput} disabled={!inputNumber} />
                </GlassCard>
              )}

              {questionType === "target_select" && isMyTurn && (
                <GlassCard>
                  <Text style={styles.sectionLabel}>{t('game.selectOne')}</Text>
                  <ShimmerLine />
                  {playerEntries.filter((p) => p.id !== myId).map((p) => (
                    <GameButton key={p.id} label={p.name} onPress={() => submitTarget(p.id)} variant="secondary" />
                  ))}
                </GlassCard>
              )}

              {questionType === "target_select" && !isMyTurn && (
                <View style={styles.waitingBox}>
                  <Text style={styles.waitingDots}>...</Text>
                  <Text style={styles.waitingText}>{t('format.selecting')(currentTurnPlayerName || t('game.nextPlayer'))}</Text>
                </View>
              )}
            </>
          )}

          {isChallenger && phase === "reveal" && currentResult && (() => {
            const parts = currentResult.split("|");
            const answerPart = parts[0];
            const drinkerPart = parts.length > 1 ? parts[1] : null;
            return (
              <>
                <Animated.View style={{ transform: [{ scale: dareResultScale }] }}>
                  <GlassCard>
                    <Text style={styles.questionEyebrow}>{t('game.result')}</Text>
                    <Text style={styles.revealText}>{answerPart}</Text>
                  </GlassCard>
                </Animated.View>
                {revealStep >= 2 && drinkerPart && (
                  <GlassCard>
                    <Text style={styles.revealDrinker}>{drinkerPart}</Text>
                  </GlassCard>
                )}
              </>
            );
          })()}
        </View>
      );
    }

    return null;
  };

  /* ── handle room_state screen transitions ── */
  useEffect(() => {
    if (phase === "question" && screen === SCREENS.LOBBY) {
      navigateTo(SCREENS.GAME);
    }
  }, [phase]);

  /* ── render ── */
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
      <PremiumBackground />
      {screen === SCREENS.HOME && (
        <LanguageToggle language={language} onSelect={changeLanguage} />
      )}
      <View style={[styles.page, useCompactCard && styles.pageCentered]}>

        {screen !== SCREENS.HOME && (
          <Pressable
            style={styles.backButton}
            onPress={() => {
              if (screen === SCREENS.SOLO_GAME) {
                if (soloModeId === "dare_basic") exitDareGame();
                else exitSoloGame();
              } else if (screen === SCREENS.DARE_SETUP) {
                navigateTo(SCREENS.MODE_MAIN);
              } else if (screen === SCREENS.MODE_MAIN) {
                navigateTo(SCREENS.HOME);
              } else if (screen === SCREENS.MODE_NEVER_SUB) {
                navigateTo(SCREENS.MODE_MAIN);
              } else {
                leaveRoom();
              }
            }}
          >
            <BlurView intensity={30} tint="dark" style={styles.backButtonBlur}>
              <Text style={styles.backIcon}>‹</Text>
            </BlurView>
          </Pressable>
        )}

        {(screen === SCREENS.GAME || screen === SCREENS.SOLO_GAME) && modeLabel && (
          <View style={styles.modeTag}>
            <BlurView intensity={20} tint="dark" style={styles.modeTagBlur}>
              <Text style={styles.modeTagText}>{modeLabel}</Text>
            </BlurView>
          </View>
        )}

        {screen !== SCREENS.GAME && screen !== SCREENS.SOLO_GAME && (
          <View style={[styles.header, screen !== SCREENS.HOME && styles.headerWithBack]}>
            {screen === SCREENS.HOME && (
              <View style={styles.logoWrap}>
                <Image source={require("./assets/logoshot.jpeg")} style={styles.logoImage} />
                <View style={styles.logoGlow} />
              </View>
            )}
            <Text style={styles.title}>{headerTitle}</Text>
            <Text style={styles.subtitle}>{headerSubtitle}</Text>
          </View>
        )}

        {screen === SCREENS.GAME || screen === SCREENS.SOLO_GAME ? (
          <Animated.View
            style={[styles.gameContainer, { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }, { scale: cardScale }] }]}
          >
            {renderCardContent()}
          </Animated.View>
        ) : (
          <Animated.View
            style={[
              styles.card,
              useCompactCard && styles.cardCompact,
              useLobbyCard && styles.cardLobby,
              { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }, { scale: cardScale }] },
            ]}
          >
            {renderCardContent()}
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

/* ── Animated Letter ── */
function AnimatedLetter({ char, index, anims }) {
  const anim = anims[index];
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const translateY = anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [18, -3, 0] });
  const scale = anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.5, 1.1, 1] });

  return (
    <Animated.Text style={[splashStyles.titleChar, { opacity, transform: [{ translateY }, { scale }] }]}>
      {char === " " ? "  " : char}
    </Animated.Text>
  );
}

/* ── Splash Screen ── */
function SplashScreen({ onFinish }) {
  const [splashLang, setSplashLang] = useState('tr');
  const splashText = TRANSLATIONS[splashLang]?.splash?.subtitle || TRANSLATIONS.tr.splash.subtitle;

  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    SafeStorage.getItem('shotic_language').then((saved) => {
      if (saved && TRANSLATIONS[saved]) setSplashLang(saved);
    }).catch(() => {});
  }, []);

  const letterAnims = useRef(splashText.split("").map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Harf animasyonları - her harf 40ms arayla geliyor
    const letterSequence = letterAnims.map((anim, i) =>
      Animated.timing(anim, { toValue: 1, duration: 280, delay: i * 40, useNativeDriver: true, easing: Easing.out(Easing.back(1.5)) })
    );

    Animated.sequence([
      Animated.delay(300),
      // Logo
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      // Shimmer
      Animated.timing(shimmer, { toValue: 1, duration: 600, useNativeDriver: true }),
      // Harfler sırayla beliriyor
      Animated.parallel(letterSequence),
      // Bekle
      Animated.delay(600),
      // Fade out
      Animated.timing(fadeOut, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => onFinish());
  }, []);

  const shimmerTranslateX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-200, 200] });

  return (
    <Animated.View style={[splashStyles.container, { opacity: fadeOut }]}>
      {/* Mor gradient arka plan */}
      <LinearGradient
        colors={["#0B0014", "#1A0533", "#0D0020", "#06000F"]}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Logo */}
      <Animated.View style={[splashStyles.logoContainer, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
        <Image source={require("./assets/logoshot.jpeg")} style={splashStyles.logoImage} resizeMode="contain" />
        {/* Kenar eritme - mor arka plana uyumlu */}
        <LinearGradient
          colors={["#0B0014", "transparent"]}
          style={splashStyles.edgeFadeTop}
          pointerEvents="none"
        />
        <LinearGradient
          colors={["transparent", "#0D0020"]}
          style={splashStyles.edgeFadeBottom}
          pointerEvents="none"
        />
        <LinearGradient
          colors={["#0B0014", "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 0.15, y: 0.5 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <LinearGradient
          colors={["transparent", "#0B0014"]}
          start={{ x: 0.85, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {/* Shimmer */}
        <Animated.View style={[splashStyles.shimmerOverlay, { transform: [{ translateX: shimmerTranslateX }] }]}>
          <LinearGradient
            colors={["transparent", "rgba(168,85,247,0.2)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </Animated.View>

      {/* Mor glow arkada */}
      <View style={splashStyles.logoGlow} pointerEvents="none" />

      {/* Title - harfler sırayla geliyor */}
      <View style={splashStyles.titleRow}>
        {splashText.split("").map((char, i) => (
          <AnimatedLetter key={i} char={char} index={i} anims={letterAnims} />
        ))}
      </View>
    </Animated.View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    backgroundColor: "#0B0014",
  },
  logoContainer: {
    width: SCREEN_WIDTH * 0.65,
    aspectRatio: 1,
    position: "relative",
    borderRadius: SCREEN_WIDTH * 0.65 / 2,
    overflow: "hidden",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  logoGlow: {
    position: "absolute",
    top: "25%",
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    borderRadius: SCREEN_WIDTH / 2,
    backgroundColor: "#7C3AED",
    opacity: 0.12,
  },
  edgeFadeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "25%",
  },
  edgeFadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "25%",
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH + 100,
  },
  titleRow: {
    position: "absolute",
    bottom: SCREEN_HEIGHT * 0.15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  titleChar: {
    fontSize: 19,
    fontWeight: "700",
    color: "rgba(192,132,252,0.7)",
    letterSpacing: 0.5,
  },
});

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [appLang, setAppLang] = useState('tr');

  useEffect(() => {
    SafeStorage.getItem('shotic_language').then((saved) => {
      if (saved && TRANSLATIONS[saved]) setAppLang(saved);
    }).catch(() => {});
  }, []);

  return (
    <ErrorBoundary language={appLang}>
      {!splashDone && <SplashScreen onFinish={() => setSplashDone(true)} />}
      {splashDone && <AppContent />}
    </ErrorBoundary>
  );
}

/* ══════════════ STYLES ══════════════ */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#050507" },
  page: { flex: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  pageCentered: { justifyContent: "center" },

  /* Glow orbs */
  nebula: { position: "absolute", borderRadius: 999 },
  nebula1: { top: -60, right: -80, width: 320, height: 320, backgroundColor: "#7C3AED" },
  nebula2: { bottom: -80, left: -60, width: 280, height: 280, backgroundColor: "#581C87" },
  nebula3: { top: "45%", left: -40, width: 200, height: 200, backgroundColor: "#9333EA" },

  /* Toast */
  toastContainer: { position: "absolute", top: 0, alignSelf: "center", zIndex: 999, borderRadius: 20, overflow: "hidden", minWidth: "80%" },
  toastBlur: { borderRadius: 20, overflow: "hidden" },
  toastInner: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, gap: 10 },
  toastDot: { width: 8, height: 8, borderRadius: 4 },
  toastDotError: { backgroundColor: "#F43F5E" },
  toastDotSuccess: { backgroundColor: "#22C55E" },
  toastText: { color: "#FAFAFA", fontSize: 14, fontWeight: "600", flex: 1 },
  toastTextError: { color: "#FCA5A5" },

  /* Glass card */
  glassOuter: { borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  glassBlur: { borderRadius: 24, overflow: "hidden" },
  glassInner: { padding: 18, gap: 8 },

  /* Section header */
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionLabel: { color: "#A1A1AA", fontSize: 11, fontWeight: "800", letterSpacing: 1.5, textTransform: "uppercase" },
  countBadge: { backgroundColor: "rgba(236,72,153,0.15)", borderWidth: 1, borderColor: "rgba(236,72,153,0.3)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 2 },
  countBadgeText: { color: "#EC4899", fontSize: 12, fontWeight: "800" },

  /* Shimmer line */
  shimmerLine: { height: 1, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 1, overflow: "hidden", marginVertical: 8 },
  shimmerGlow: { position: "absolute", top: 0, left: 0, width: 80, height: 1, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 1 },

  /* Back button */
  backButton: { position: "absolute", top: 12, left: 12, zIndex: 10, width: 44, height: 44, borderRadius: 22, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  backButtonBlur: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 22 },
  backIcon: { color: "#FAFAFA", fontSize: 26, lineHeight: 28, marginTop: -2, fontWeight: "600" },

  /* Mode tag */
  modeTag: { position: "absolute", top: 14, right: 14, zIndex: 10, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  modeTagBlur: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  modeTagText: { color: "#A1A1AA", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },

  /* Header */
  header: { alignItems: "center", marginBottom: 20, marginTop: 4 },
  headerWithBack: { marginTop: 54 },
  logoWrap: { alignItems: "center", justifyContent: "center", marginBottom: 16 },
  logoImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: "rgba(236,72,153,0.3)" },
  logoGlow: { position: "absolute", width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(236,72,153,0.1)" },
  title: { fontSize: 34, fontWeight: "900", color: "#FAFAFA", letterSpacing: -0.5 },
  subtitle: { marginTop: 6, fontSize: 15, color: "#71717A", textAlign: "center", paddingHorizontal: 20, fontWeight: "500" },

  /* Card */
  card: { flex: 1, borderRadius: 28, backgroundColor: "rgba(15, 15, 20, 0.6)", padding: 20, paddingBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" },
  cardCompact: { flex: 0, paddingVertical: 24, marginTop: 0 },
  cardLobby: { flex: 0, marginTop: 12 },

  stack: { gap: 14 },
  gameContainer: { flex: 1, marginTop: 8 },
  gameStack: { flex: 1, justifyContent: "center", gap: 16 },

  /* Swipe hint */
  swipeHintWrap: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 16 },
  swipeArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  swipeArrowText: { color: "rgba(161,161,170,0.5)", fontSize: 16, fontWeight: "600" },
  swipeHint: { color: "rgba(161,161,170,0.4)", fontSize: 13, letterSpacing: 2, textTransform: "uppercase", fontWeight: "600" },

  /* Segment */
  segmentWrap: { flexDirection: "row", backgroundColor: "rgba(9, 9, 11, 0.6)", borderRadius: 16, padding: 4, borderWidth: 1, borderColor: "rgba(255,255,255,0.04)" },
  segmentButton: { flex: 1, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  segmentButtonActive: {},
  segmentGradient: { flex: 1, width: "100%", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  segmentText: { color: "#52525B", fontSize: 14, fontWeight: "700" },
  segmentTextActive: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },

  panelViewport: { overflow: "hidden" },
  panelTrack: { flexDirection: "row" },
  panelPage: { justifyContent: "flex-start" },

  /* Input */
  inputWrapper: { gap: 6 },
  inputLabel: { color: "#71717A", fontSize: 11, fontWeight: "700", letterSpacing: 1.2, marginLeft: 4 },
  input: { height: 56, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", backgroundColor: "rgba(9, 9, 11, 0.6)", color: "#FAFAFA", paddingHorizontal: 16, fontSize: 16, fontWeight: "600" },
  inputFlex: { flex: 1 },
  inputRow: { flexDirection: "row", gap: 10 },
  addBtn: { width: 56, height: 56, borderRadius: 16, overflow: "hidden" },
  addBtnGradient: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  addBtnText: { color: "#FFFFFF", fontSize: 24, fontWeight: "700" },

  /* Mode card */
  modeCard: { borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", backgroundColor: "rgba(15, 15, 20, 0.7)", paddingVertical: 14, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 14, overflow: "hidden" },
  modeCardGlow: { ...StyleSheet.absoluteFillObject, borderRadius: 20 },
  modeCardEmoji: { fontSize: 32 },
  modeCardTextWrap: { flex: 1, gap: 2 },
  modeCardTitle: { color: "#FAFAFA", fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  modeCardDesc: { color: "#71717A", fontSize: 12, fontWeight: "500" },
  playerBadge: { marginTop: 4, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, alignSelf: "flex-start" },
  playerBadgePink: { backgroundColor: "rgba(236,72,153,0.12)", borderWidth: 1, borderColor: "rgba(236,72,153,0.2)" },
  playerBadgeOrange: { backgroundColor: "rgba(251,146,60,0.12)", borderWidth: 1, borderColor: "rgba(251,146,60,0.2)" },
  playerBadgeCyan: { backgroundColor: "rgba(6,182,212,0.12)", borderWidth: 1, borderColor: "rgba(6,182,212,0.2)" },
  playerBadgeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },

  /* Mode option */
  modeOption: { borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", backgroundColor: "rgba(15, 15, 20, 0.6)", paddingVertical: 16, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modeOptionActive: { borderColor: "rgba(236,72,153,0.4)", backgroundColor: "rgba(236, 72, 153, 0.08)" },
  modeOptionLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  modeOptionIcon: { color: "#EC4899", fontSize: 16, fontWeight: "800", width: 20, textAlign: "center" },
  modeOptionText: { color: "#D4D4D8", fontSize: 16, fontWeight: "600" },
  modeOptionTextActive: { color: "#F472B6" },

  /* Button */
  buttonGlow: { position: "absolute", top: 4, left: 20, right: 20, bottom: -4, borderRadius: 20, backgroundColor: "#EC4899", opacity: 0.4 },
  primaryButtonGradient: { paddingVertical: 18, paddingHorizontal: 24, borderRadius: 20, alignItems: "center", justifyContent: "center", shadowColor: "#EC4899", shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 16, letterSpacing: 0.5, textTransform: "uppercase" },
  secondaryButton: { paddingVertical: 18, paddingHorizontal: 24, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(15, 15, 20, 0.6)", alignItems: "center", justifyContent: "center" },
  secondaryButtonText: { color: "#A1A1AA", fontWeight: "700", fontSize: 16, letterSpacing: 0.3, textTransform: "uppercase" },

  /* Player avatar */
  playerAvatarRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6, gap: 12 },
  playerAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  playerAvatarText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  playerAvatarInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  playerAvatarName: { color: "#E4E4E7", fontSize: 16, fontWeight: "700" },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  hostBadge: { backgroundColor: "rgba(236,72,153,0.15)", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 11, borderWidth: 1, borderColor: "rgba(236,72,153,0.2)" },
  hostBadgeText: { color: "#EC4899", fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },

  /* Remove button */
  removeBtn: { marginLeft: "auto", width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(244,63,94,0.1)", borderWidth: 1, borderColor: "rgba(244,63,94,0.2)", alignItems: "center", justifyContent: "center" },
  removeBtnText: { color: "#F43F5E", fontSize: 16, fontWeight: "800" },

  /* Player grid (two-column) */
  playerGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 8 },
  playerChip: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 12, paddingVertical: 6, paddingLeft: 6, paddingRight: 4, gap: 5, width: "48.5%" },
  playerChipAvatar: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  playerChipAvatarText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  playerChipName: { color: "#E4E4E7", fontSize: 13, fontWeight: "700", flex: 1 },
  playerChipRemove: { width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(244,63,94,0.12)", borderWidth: 1, borderColor: "rgba(244,63,94,0.2)", alignItems: "center", justifyContent: "center" },
  playerChipRemoveText: { color: "#F43F5E", fontSize: 10, fontWeight: "800" },

  /* Empty state */
  emptyState: { alignItems: "center", paddingVertical: 20, gap: 4 },
  emptyStateIcon: { fontSize: 32, marginBottom: 4 },
  emptyStateText: { color: "#71717A", fontSize: 15, fontWeight: "600" },
  emptyStateHint: { color: "#52525B", fontSize: 13, fontWeight: "500" },

  /* Turn badge */
  turnBadge: { alignSelf: "center", borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "rgba(6,182,212,0.2)", marginBottom: 8 },
  turnBadgeGradient: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, gap: 8, borderRadius: 16 },
  turnBadgeLabel: { color: "#06B6D4", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  turnBadgeName: { color: "#FAFAFA", fontSize: 16, fontWeight: "800" },

  /* Lobby code */
  lobbyCode: { color: "#FAFAFA", fontSize: 38, fontWeight: "900", letterSpacing: 6, textAlign: "center", marginVertical: 8 },
  lobbyHint: { color: "#52525B", fontSize: 12, textAlign: "center", fontWeight: "500" },

  /* Copy button */
  copyBtn: { borderRadius: 12, overflow: "hidden" },
  copyBtnGradient: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  copyBtnIcon: { color: "#FAFAFA", fontSize: 14, fontWeight: "800" },

  /* Waiting */
  waitingBox: { alignItems: "center", paddingVertical: 16, gap: 4 },
  waitingDots: { color: "#EC4899", fontSize: 24, fontWeight: "800", letterSpacing: 4 },
  waitingText: { color: "#71717A", fontSize: 14, fontWeight: "600" },

  /* Question card */
  questionEyebrow: { color: "#06B6D4", fontSize: 11, fontWeight: "900", letterSpacing: 1.5, marginBottom: 12, textAlign: "center" },
  questionHero: { borderRadius: 24, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.08)", backgroundColor: "rgba(20, 20, 25, 0.8)", paddingHorizontal: 6, paddingVertical: 6, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  questionHeroWithFrame: { backgroundColor: "transparent", borderWidth: 0, padding: 0, overflow: "hidden", borderRadius: 20, marginBottom: 0, shadowColor: "#000", shadowOpacity: 0.7, shadowRadius: 28, shadowOffset: { width: 0, height: 14 }, elevation: 14 },
  cardFrameImage: { width: "100%", aspectRatio: 0.72, justifyContent: "center", alignItems: "center" },
  cardFrameImageStyle: { borderRadius: 20 },
  cardFrameContent: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: "20%", paddingTop: "12%", paddingBottom: "20%" },
  questionCardInner: { borderRadius: 20, backgroundColor: "rgba(15, 15, 20, 0.95)", paddingHorizontal: 20, paddingVertical: 28, alignItems: "center", justifyContent: "center", minHeight: 160 },
  questionCardTop: { alignItems: "center", marginBottom: 16 },
  questionIllustration: { fontSize: 36 },
  questionTextNever: { color: "#FAFAFA", fontSize: 26, lineHeight: 36, fontWeight: "800", textAlign: "center", letterSpacing: -0.2 },
  questionTextDare: { color: "#FAFAFA", fontSize: 24, lineHeight: 34, fontWeight: "800", textAlign: "center", letterSpacing: -0.2 },
  questionTextOnFrame: { color: "#2D2D3A", fontSize: 20, lineHeight: 30, fontWeight: "600", fontFamily: "Georgia", letterSpacing: 0.3 },
  questionCounter: { fontSize: 12, color: "#52525B", textAlign: "center", marginTop: 14, fontWeight: "600", letterSpacing: 0.5 },
  questionCounterOnFrame: { color: "#999", fontFamily: "Georgia", fontStyle: "italic", fontSize: 13 },

  revealStage: { minHeight: 80, alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 8, paddingVertical: 10, borderRadius: 16, backgroundColor: "rgba(9, 9, 11, 0.4)" },
  revealText: { color: "#FAFAFA", fontSize: 22, fontWeight: "900", textAlign: "center", letterSpacing: 0.3 },
  revealDrinker: { color: "#F472B6", fontSize: 24, fontWeight: "900", textAlign: "center", letterSpacing: 0.3 },
});
