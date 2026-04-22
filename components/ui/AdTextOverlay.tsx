import React from 'react';
import { GenerateImageParams, AdLayout } from '../../types';

interface AdTextOverlayProps {
  params: GenerateImageParams;
  overrides?: Partial<GenerateImageParams>;
}

export const AdTextOverlay: React.FC<AdTextOverlayProps> = ({ params, overrides = {} }) => {
  const adTitle = overrides.adTitle !== undefined ? overrides.adTitle : params.adTitle;
  const adSubheading = overrides.adSubheading !== undefined ? overrides.adSubheading : params.adSubheading;
  const adCta = overrides.adCta !== undefined ? overrides.adCta : params.adCta;
  const adLayout = overrides.adLayout !== undefined ? overrides.adLayout : params.adLayout;
  const adFontFamily = overrides.adFontFamily !== undefined ? overrides.adFontFamily : (params.adFontFamily || 'font-sans font-bold');
  const adTextColor = overrides.adTextColor !== undefined ? overrides.adTextColor : (params.adTextColor || 'text-white');
  const adTitleSize = overrides.adTitleSize !== undefined ? overrides.adTitleSize : (params.adTitleSize || 32);
  const adSubheadingSize = overrides.adSubheadingSize !== undefined ? overrides.adSubheadingSize : (params.adSubheadingSize || 16);
  const adCtaBgColor = overrides.adCtaBgColor !== undefined ? overrides.adCtaBgColor : (params.adCtaBgColor || '#6A5AE0');
  const adImageZoom = overrides.adImageZoom !== undefined ? overrides.adImageZoom : (params.adImageZoom || 1);
  const adImageX = overrides.adImageX !== undefined ? overrides.adImageX : (params.adImageX || 0);
  const adImageY = overrides.adImageY !== undefined ? overrides.adImageY : (params.adImageY || 0);

  if (!adTitle && !adSubheading && !adCta) {
    return null;
  }

  let containerClasses = "absolute inset-0 flex p-6 pointer-events-none";
  let textAlignment = "text-left";
  let contentClasses = "flex flex-col justify-center max-w-[50%]";

  switch (adLayout) {
    case AdLayout.TextRightImageLeft:
      containerClasses += " justify-end items-center";
      textAlignment = "text-left";
      break;
    case AdLayout.TextLeftImageRight:
      containerClasses += " justify-start items-center";
      textAlignment = "text-left";
      break;
    case AdLayout.TextTopBottomImageCenter:
      containerClasses += " flex-col justify-between items-center py-8";
      textAlignment = "text-center";
      contentClasses = "flex flex-col items-center w-full max-w-[80%]";
      break;
    case AdLayout.ProductShowcase:
      containerClasses += " justify-center items-end pb-8";
      textAlignment = "text-center";
      contentClasses = "flex flex-col items-center w-full max-w-[80%]";
      break;
    default:
      containerClasses += " justify-center items-center";
      textAlignment = "text-center";
      break;
  }

  // Helper to apply text color and font
  const titleStyle = { 
    fontFamily: adFontFamily, 
    color: adTextColor, 
    fontSize: adTitleSize,
    textShadow: '0 2px 8px rgba(0,0,0,0.8)'
  };
  const subheadingStyle = { 
    fontFamily: adFontFamily, 
    color: adTextColor, 
    fontSize: adSubheadingSize,
    opacity: 0.9,
    textShadow: '0 1px 4px rgba(0,0,0,0.8)'
  };

  return (
    <div className={containerClasses}>
      {adLayout === AdLayout.TextTopBottomImageCenter ? (
        <>
          <div className="w-full text-center">
            {adTitle && <h2 className="font-black leading-tight mb-3" style={titleStyle}>{adTitle}</h2>}
          </div>
          <div className="w-full text-center flex flex-col items-center">
            {adSubheading && <p className="font-medium mb-6" style={subheadingStyle}>{adSubheading}</p>}
            {adCta && (
              <div className="inline-block mt-2 px-6 py-3 text-white font-bold rounded-full shadow-lg text-sm uppercase tracking-wider" style={{ backgroundColor: adCtaBgColor }}>
                {adCta}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className={`${contentClasses} ${textAlignment}`}>
          {adTitle && <h2 className="font-black leading-tight mb-3" style={titleStyle}>{adTitle}</h2>}
          {adSubheading && <p className="font-medium mb-6" style={subheadingStyle}>{adSubheading}</p>}
          {adCta && (
            <div className="inline-block mt-auto px-6 py-3 text-white font-bold rounded-full shadow-lg text-sm uppercase tracking-wider w-fit" style={{ backgroundColor: adCtaBgColor }}>
              {adCta}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
