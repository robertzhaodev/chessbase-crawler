// mw 27.3.2013
// ES 6 MW: Feb 27, 2020

export var Language = {

	ENG: 0,
	DEU: 1, GER: 1,
	FRA: 2,
	ESP: 3,
	ITA: 4,
	NED: 5,
	POR: 6,
	DEF: 7,
	SLO: 8,
	SWE: 9,
	BAS: 10,
	SVK: 11,
	POL: 12,
	CZE: 13,
	CAT: 14,
	TRK: 15,
	MGY: 16,
	RUS: 17,
	GRK: 18,
	ROM: 19,
	CHN: 20,
	UN: 21,
	NOR: 22,
	HEB: 23,
	UKR: 24,
	VIE: 25,
	ARA: 26,
	SER: 27,
	LIT: 28,
	BRA: 29,	// brasilian portuguese
	FAR: 30,	// Farsi LTR
	CRO: 31,
	GAL: 32,	// Gaelic (Irish)
	HIN: 33,	// Hindi

	getStrUserLanguage: function ()
	{
		// const languages = ['en-US', 'en', 'vi'];
		//
		// // only newest chrome/firefox:
		// if ( navigator.languages !== undefined && navigator.languages.length )
		// {
		// 	return navigator.languages[0];
		// }
		//
		// if ( navigator.language !== undefined )
		// 	return navigator.language;
		// if ( navigator.userLanguage !== undefined )	// IE
		// 	return navigator.userLanguage;

		return "en-en";
	},

	
	getStrUserLanguageTwoChars: function()
	{
	    var ln = this.getStrUserLanguage();
	    return ln.slice( 0, 2 );
	},

	// ne map wird mal gebraucht.
	getUserLanguageId: function ()
	{
		var lang = Language.getStrUserLanguage();

      //"#IFDEBUG"
      //lang = "de-DE";
      //"#ENDIF"
		return this.getLanguageIdOfParam( lang );
	},

	getLanguageIdOfParam: function( param )
	{
		if ( param.indexOf( "de" ) > -1 )
			return this.DEU;
		if ( param.indexOf( "es" ) > -1 )
			return this.ESP;
		if ( param.indexOf( "nl" ) > -1 )
			return this.NED;
		if ( param.indexOf( "fr" ) > -1 )
			return this.FRA;
		if ( param.indexOf( "it" ) > -1 )
			return this.ITA;
		if ( param.indexOf( "sl" ) > -1 )
			return this.SLO;
		if ( param.indexOf( "sv" ) > -1 )
			return this.SWE;
		if ( param.indexOf( "ro" ) > -1 )
			return this.ROM;
		if ( param.indexOf( "zh" ) > -1 )
			return this.CHN;
		if ( param.indexOf( "ru" ) > -1 )
			return this.RUS;
		if ( param.indexOf( "no" ) > -1 )
			return this.NOR;
		if ( param.indexOf( "pl" ) > -1 )
			return this.POL;
		if ( param.indexOf( "he" ) > -1 )
			return this.HEB;
		if ( param.indexOf( "ca" ) > -1 )
			return this.CAT;
		if ( param.indexOf( "tr" ) > -1 )
			return this.TRK;
		if ( param.indexOf( "sl" ) > -1 )
			return this.SLO;
		if ( param.indexOf( "el" ) > -1 )
			return this.GRK;
		if ( param.indexOf( "uk" ) > -1 )
			return this.UKR;
		if ( param.indexOf( "vi" ) > -1 )
			return this.VIE;
		if ( param.indexOf( "ar" ) > -1 )
			return this.ARA;
		if ( param.indexOf( "sr" ) > -1 )
			return this.SER;
		if ( param.indexOf( "lt" ) > -1 )
			return this.LIT;
		if ( param.indexOf( "pt-br" ) > -1 )
			return this.BRA;
		if ( param.indexOf( "pt" ) > -1 )
			return this.BRA;	// this.POR
		if ( param.indexOf( "fa" ) > -1 )
			return this.FAR;
		if ( param.indexOf( "ga" ) > -1 )
			return this.GAL;
		if ( param.indexOf( "hr" ) > -1 )
			return this.CRO;
		if ( param.indexOf( "hi" ) > -1 )
			return this.HIN;
		if ( param.indexOf( "cs" ) > -1 )
			return this.CZE;

		return this.ENG;
	},

	getParamOfLanguageId: function( id )
	{
		switch( id )
		{
			default:
			case Language.ENG:
				return "en";
			case Language.DEU:
				return "de";
			case Language.ESP:
				return "es";
			case Language.NED:
				return "nl";
			case Language.FRA:
				return "fr";
			case Language.ITA:
				return "it";
			case Language.POR:
				return "pt";
			case Language.SLO:
				return "sl";
			case Language.SWE:
				return "sv";
			case Language.ROM:
				return "ro";
			case Language.CHN:
				return "zh";
			case Language.RUS:
				return "ru";
			case Language.NOR:
				return "no";
			case Language.POL:
				return "pl";
			case Language.HEB:
				return "he";
			case Language.CAT:
				return "ca";
			case Language.TRK:
				return "tr";
			case Language.GRK:
				return "el";
			case Language.UKR:
				return "uk";
			case Language.VIE:
				return "vi";
			case Language.ARA:
				return "ar";
			case Language.SER:
				return "sr";
			case Language.LIT:
				return "lt";
			case Language.BRA:
				return "pt";
			case Language.FAR:
				return "fa";
			case Language.CRO:
				return "hr";
			case Language.GAL:
				return "ga";
			case Language.HIN:
				return "hi";
			case Language.CZE:
				return "cs";
		}
	},

	getHelpParamOfLanguageId: function( langId )
	{
		switch ( langId )
		{
			default:
			case Language.ENG:
				return "en";
			case Language.DEU:
				return "de";
			case Language.ESP:
				return "es";
			case Language.FRA:
				return "fr";
			case Language.NED:
				return "nl";
			case Language.ITA:
				return "it";
		}
	},

	getRibbonFlagName: function ( langId )
	{
		switch ( langId )
		{
			default:
			case Language.ENG:
				if ( this.getStrUserLanguage() === "en-us" )
					return "us";
				else
					return "gb";
			case Language.DEU:
				if ( this.getStrUserLanguage() === "de-at" )
					return "at";
				else
					return "de";
			case Language.ESP:
				return "es";
			case Language.NED:
				return "nl";
			case Language.ROM:
				return "ro";
			case Language.CHN:
				switch ( this.getStrUserLanguage() )
				{
					default:
					case "zh-cn":
						return "cn";
					case "zh-tw":
						return "tw";
					case "zh-sg":
						return "si";
					case "zh-hk":
						return "hk";
				}
			case Language.FRA:
				return "fr";
			case Language.RUS:
				return "ru";
			case Language.NOR:
				return "no";
			case Language.ITA:
				return "it";
			case Language.POL:
				return "pl";
			case Language.UN:
				return "_United_Nations";
			case Language.HEB:
				return "il";
			case Language.CAT:
				return "_Catalonia";
			case Language.TRK:
				return "tr";
			case Language.SLO:
				return "si";	// sl is Sierra Leone
			case Language.GRK:
				return "gr";
			case Language.UKR:
				return "ua";
			case Language.VIE:
				return "vn";		// vi is virgin islands
			case Language.ARA:
				return "sa";
			case Language.SER:
				return "rs";
			case Language.LIT:
				return "lt";
			case Language.BRA:
				//if ( this.getStrUserLanguage() == "pt-br" )
				//	return "br";
				//else
				//	return "pt";
				return "br";
			case Language.FAR:
				return "ir";
			case Language.CRO:
				return "hr";
			case Language.GAL:
				return "ie";
			case Language.HIN:
				return "in";
			case Language.CZE:
				return "cz";
		}
	}
};

//TODO solve above in enum

Language.getInternalName = function ( lid )
{
	switch ( lid )
	{
		default:
		case Language.ENG:
			return "ENG";
		case Language.DEU:
		case Language.GER:
			return "GER";
		case Language.ESP:
			return "ESP";
		case Language.NED:
			return "NED";
		case Language.ROM:
			return "ROM";
		case Language.CHN:
			return "CHN";
		case Language.FRA:
			return "FRA";
		case Language.RUS:
			return "RUS";
		case Language.NOR:
			return "NOR";
		case Language.POL:
			return "POL";
		case Language.ITA:
			return "ITA";
		case Language.HEB:
			return "HEB";
		case Language.CAT:
			return "CAT";
		case Language.TRK:
			return "TRK";
		case Language.SLO:
			return "SLO";
		case Language.UN:	// Convention
			return "UN";
		case Language.GRK:
			return "EL";
		case Language.UKR:
			return "UKR";
		case Language.VIE:
			return "VIE";
		case Language.ARA:
			return "ARA";
		case Language.SER:
			return "SER";
		case Language.LIT:
			return "LIT";
		case Language.BRA:
			return "BRA";
		case Language.FAR:
			return "FAR";
		case Language.CRO:
			return "CRO";
		case Language.GAL:
			return "GAL";
		case Language.HIN:
			return "HIN";
		case Language.CZE:
			return "CZE";
	}
};

Language.getNativeLangName = function ( lid )
{
	switch ( lid )
	{
		default:
		case Language.ENG:
			return "English";
		case Language.DEU:
			return "Deutsch";
		case Language.ESP:
			return "Español";
		case Language.NED:
			return "Nederlands";
		case Language.ROM:
			return "Român";
		case Language.CHN:
			return "中文";
		case Language.FRA:
			return "Français";
		case Language.RUS:
			return "Русский";
		case Language.NOR:
			return "Norsk";
		case Language.POL:
			return "Polski";
		case Language.ITA:
			return "Italiano";
		case Language.HEB:
			return "עברית";
		case Language.CAT:
			return "Català";
		case Language.TRK:
			return "Türkçe";
		case Language.SLO:
			return "Slovenski";
		case Language.GRK:
			return "Ελληνικά"
		case Language.UKR:
			return "Українська";
		case Language.VIE:
			return "Tiếng Việt";
		case Language.ARA:
			return "العربية";
		case Language.SER:
			return "Srbski";
		case Language.LIT:
			return "Lietuvių";
		case Language.BRA:
			return "Português";
		case Language.FAR:
			return "فارسی"
		case Language.CRO:
			return "Hrvatski";
		case Language.GAL:
			return "Gaeilge";
		case Language.HIN:
			return "हिन्दी";
		case Language.CZE:
			return "Čeština";
	}
};

Language.getNativeLangNames = function ( lids )
{
	var ret = [];
	lids.forEach( function ( lid )
	{
		ret.push( this.getNativeLangName( lid ) );

	}.bind( this ) );
	return ret;
};

Language.getFlagNames = function ( lids )
{
	var ret = [];
	lids.forEach( function ( lid )
	{
		ret.push( this.getRibbonFlagName( lid ) );
	}.bind( this ) );

	return ret;
};

/*
af	Afrikaans	sq	Albanian
ar-sa	Arabic (Saudi Arabia)	ar-iq	Arabic (Iraq)
ar-eg	Arabic (Egypt)	ar-ly	Arabic (Libya)
ar-dz	Arabic (Algeria)	ar-ma	Arabic (Morocco)
ar-tn	Arabic (Tunisia)	ar-om	Arabic (Oman)
ar-ye	Arabic (Yemen)	ar-sy	Arabic (Syria)
ar-jo	Arabic (Jordan)	ar-lb	Arabic (Lebanon)
ar-kw	Arabic (Kuwait)	ar-ae	Arabic (U.A.E.)
ar-bh	Arabic (Bahrain)	ar-qa	Arabic (Qatar)
eu	Basque (Basque)	bg	Bulgarian
be	Belarusian	ca	Catalan
zh-tw	Chinese (Taiwan)	zh-cn	Chinese (PRC)
zh-hk	Chinese (Hong Kong SAR)	zh-sg	Chinese (Singapore)
hr	Croatian	cs	Czech
da	Danish	nl	Dutch (Standard)
nl-be	Dutch (Belgium)	en	English
en-us	English (United States)	en-gb	English (United Kingdom)
en-au	English (Australia)	en-ca	English (Canada)
en-nz	English (New Zealand)	en-ie	English (Ireland)
en-za	English (South Africa)	en-jm	English (Jamaica)
en	English (Caribbean)	en-bz	English (Belize)
en-tt	English (Trinidad)	et	Estonian
fo	Faeroese	
fa	Farsi
fi	Finnish	fr	French (Standard)
fr-be	French (Belgium)	fr-ca	French (Canada)
fr-ch	French (Switzerland)	fr-lu	French (Luxembourg)
gd	Gaelic (Scotland)	
ga	Irish
de	German (Standard)	de-ch	German (Switzerland)
de-at	German (Austria)	de-lu	German (Luxembourg)
de-li	German (Liechtenstein)	
el	Greek
he	Hebrew	hi	Hindi
hu	Hungarian	
is	Icelandic
id	Indonesian	
it	Italian (Standard)
it-ch	Italian (Switzerland)	ja	Japanese
ko	Korean	ko	Korean (Johab)
lv	Latvian	lt	Lithuanian
mk	Macedonian (FYROM)	ms	Malaysian
mt	Maltese	no	Norwegian (Bokmal)
no	Norwegian (Nynorsk)	pl	Polish
pt-br	Portuguese (Brazil)	pt	Portuguese (Portugal)
rm	Rhaeto-Romanic	ro	Romanian
ro-mo	Romanian (Republic of Moldova)	ru	Russian
ru-mo	Russian (Republic of Moldova)	sz	Sami (Lappish)
sr	Serbian (Cyrillic)	sr	Serbian (Latin)
sk	Slovak	sl	Slovenian
sb	Sorbian	es	Spanish (Spain)
es-mx	Spanish (Mexico)	es-gt	Spanish (Guatemala)
es-cr	Spanish (Costa Rica)	es-pa	Spanish (Panama)
es-do	Spanish (Dominican Republic)	es-ve	Spanish (Venezuela)
es-co	Spanish (Colombia)	es-pe	Spanish (Peru)
es-ar	Spanish (Argentina)	es-ec	Spanish (Ecuador)
es-cl	Spanish (Chile)	es-uy	Spanish (Uruguay)
es-py	Spanish (Paraguay)	es-bo	Spanish (Bolivia)
es-sv	Spanish (El Salvador)	es-hn	Spanish (Honduras)
es-ni	Spanish (Nicaragua)	es-pr	Spanish (Puerto Rico)
sx	Sutu	sv	Swedish
sv-fi	Swedish (Finland)	th	Thai
ts	Tsonga	tn	Tswana
tr	Turkish	uk	Ukrainian
ur	Urdu	ve	Venda
vi	Vietnamese	xh	Xhosa
ji	Yiddish	zu	Zulu
*/



/*
Wish List:

* ar	Arabic (Saudi Arabia)
bg	Bulgarian
be	Belarusian	
* ca	Catalan
* zh-cn	Chinese (PRC)
hr	Croatian	
cs	Czech
da	Danish	
et	Estonian
fi	Finnish	
* fr	French (Standard)
* de	German (Standard)
* el	Greek
*he	Hebrew	
hi	Hindi
hu	Hungarian	
is	Icelandic
id	Indonesian	
*it	Italian (Standard)
ja	Japanese
ko	Korean	
lv	Latvian	
* lt	Lithuanian
mk	Macedonian (FYROM)	
ms	Malaysian
* nl	Dutch (Standard)
* no	Norwegian
(*) pl	Polish
pt	Portuguese (Portugal)
* ro	Romanian
* ru	Russian
* sr	Serbian (Cyrillic)	
sk	Slovak	
* sl	Slovenian
* es	Spanish (Spain)
sv	Swedish
th	Thai
*tr	Turkish	
*uk	Ukrainian
*vi	Vietnamese

*/

/*
Schachlich wichtig, ausstehend:

* ar	Arabic	
bg	Bulgarian
cs	Czech
da	Danish	
fi	Finnish	
hi	Hindi
hu	Hungarian	
id	Indonesian	
pt	Portuguese (Brasil)
*sr	Serbian (Cyrillic)	
sk	Slovak	
sv	Swedish

*/


