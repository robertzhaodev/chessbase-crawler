// ST 2011
// "use strict";

export class CBDate
{
   constructor ( _year, _month, _day )
   {
      // NH2020 Rewritten with if else
      // Removed the D.prototype.year etc. fields from outside the function

      if ( _year )
         this.year = _year;
      else 
         this.year = 0;

      if ( _month )
         this.month = _month;
      else
         this.month = 0

      if ( _day )
         this.day = _day;
      else
         this.day = 0
   };

   // NH2020
   // D.prototype.year = 0;
   // D.prototype.month = 0;
   // D.prototype.day = 0;

   toString ()
   {
      return String.formatEx( "{day}.{month}.{year}", this );
   };

   static g_regexPGN = /(?:(\d{4})|\?{4})\.(?:(\d{2})|\?{2})\.(?:(\d{2})|\?{2})/;

   static fromPGNString ( _str )
   {
      var match = CBDate.g_regexPGN.exec( _str );
      if ( match )
      {
         return new CBDate ( Number( match[1] ), Number( match[2] ), Number( match[3] ) );
      }
      return new CBDate ();
   };

   constructFromNum ( date )
   {
      this.year = date >> 9;
      this.month = ( date >> 5 ) & 0x0f;
      this.day = date & 0x1f;
   };

   setToday ()
   {
      var date = new Date();	// js date

      this.year = date.getFullYear();
      this.month = date.getMonth() + 1;
      this.day = date.getDate();

   };

   static today ()	//static
   {
      var d = new CBDate();
      d.setToday();
      return d;
   };

   getNum ()
   {
      return ( this.year << 9 ) | ( this.month << 5 ) | this.day;
   };

   fromDataBuf ( buf )
   {
      var num = buf.readInt32();
      this.constructFromNum( num );
   };

   toDataBuf ( buf )
   {
      var num = ( this.year << 9 ) | ( this.month << 5 ) | this.day;
      buf.writeInt32( num );
   };

   toLocaleString ()
   {
      //Nun ja...
      //		var format = Localization.getObject( DateFormats );
      //KEEP IT SIMPLE, STUPID!!!
      var res = "";
      if ( this.year )
      {
         var res = this.year.toString();
         if ( this.month )
         {
            res = this.month.toString() + "." + res;
            if ( this.month < 10 )
               res = "0" + res;
            if ( this.day )
            {
               res = this.day.toString() + "." + res;
               if ( this.day < 10 )
                  res = "0" + res;
            }
         }
      }
      return res;
   };

   toPGNString ()
   {
      var res = "";
      if ( this.year )
      {
         res = this.year.toString();
         if ( this.month )
         {
            var month = this.month.toString();
            if ( this.month < 10 )
               month = "0" + month;
            res += "." + month;
         }
         else
            res += ".??";
         if ( this.day )
         {
            var day = this.day.toString();
            if ( this.day < 10 )
               day = "0" + day;
            res += "." + day;
         }
         else
            res += ".??";
      }
      return res;
   };

   getDay ()
   {
      return this.day;
   };

   setDay ( _day )
   {
      this.day = _day;
   };

   getMonth ()
   {
      return this.month;
   };

   setMonth ( _month )
   {
      this.month = _month;
   };

   getYear ()
   {
      return this.year;
   };

   setYear ( _year )
   {
      this.year = _year;
   };

   static getThisYear ()
   {
      var d = new CBDate();
      d.setToday();

      return d.getYear();
   };


   static getShortDateString ( _date )
   {
      var d = _date.getDate().toString();
      var m = ( _date.getMonth() + 1 ).toString();
      var y = _date.getFullYear();

      //var format = Localization.getObject( DateFormats );

      //return String.formatEx( format.short, { d: d, m: m, y: y } );
      alert( "notimpl" );
      return y + m + d;
   }

}

//var DateFormats = {};
//DateFormats.invariant = { short: "{d}.{m}.{y}" };
//DateFormats.en = { short: "{d}.{m}.{y}" };
//DateFormats.en_us = { short: "{d}.{m}.{y}" };