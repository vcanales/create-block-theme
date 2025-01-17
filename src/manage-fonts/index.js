import { useState, useEffect } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import FontFamily from './font-family';

import DemoTextInput from '../demo-text-input';
import FontsPageLayout from '../fonts-page-layout';
import HelpModal from './help-modal';
import FontsSidebar from '../fonts-sidebar';
import PageHeader from './page-header';
import ConfirmDeleteModal from './confirm-delete-modal';
import { localFileAsThemeAssetUrl } from '../utils';
import './manage-fonts.css';

export function ManageFonts() {
	const nonce = document.querySelector( '#nonce' ).value;

	// The element where the list of theme fonts is rendered coming from the server as JSON
	const themeFontsJsonElement = document.querySelector( '#theme-fonts-json' );

	// The form element that will be submitted to the server
	const manageFontsFormElement =
		document.querySelector( '#manage-fonts-form' );

	// The theme font list coming from the server as JSON
	const themeFontsJsonValue = themeFontsJsonElement.innerHTML;

	const themeFontsJson = JSON.parse( themeFontsJsonValue ) || [];

	// The client-side theme font list is initizaliased with the server-side theme font list
	const [ newThemeFonts, setNewThemeFonts ] = useState( themeFontsJson );

	// Object where we store the font family or font face index position in the newThemeFonts array that is about to be removed
	const [ fontToDelete, setFontToDelete ] = useState( {
		fontFamily: undefined,
		weight: undefined,
		style: undefined,
	} );

	// dialogs states
	const [ showConfirmDialog, setShowConfirmDialog ] = useState( false );
	const [ isHelpOpen, setIsHelpOpen ] = useState( false );

	// When client side font list changes, we update the server side font list
	useEffect( () => {
		// Avoids running this effect on the first render
		if ( fontToDelete.fontFamily !== undefined ) {
			// Submit the form to the server
			manageFontsFormElement.submit();
		}
	}, [ newThemeFonts ] );

	const toggleIsHelpOpen = () => {
		setIsHelpOpen( ! isHelpOpen );
	};

	function requestDeleteConfirmation( fontFamily, weight, style ) {
		setFontToDelete(
			{ fontFamily, weight, style },
			setShowConfirmDialog( true )
		);
	}

	function confirmDelete() {
		setShowConfirmDialog( false );
		// if fontFaceIndex.weight and fontFace.styles are undefined, we are deleting a font family
		if (
			fontToDelete.weight !== undefined &&
			fontToDelete.style !== undefined
		) {
			deleteFontFace(
				fontToDelete.fontFamily,
				fontToDelete.weight,
				fontToDelete.style
			);
		} else {
			deleteFontFamily( fontToDelete.fontFamily );
		}
	}

	function cancelDelete() {
		setFontToDelete( {} );
		setShowConfirmDialog( false );
	}

	function deleteFontFamily( fontFamily ) {
		const updatedFonts = newThemeFonts.map( ( family ) => {
			if (
				fontFamily === family.fontFamily ||
				fontFamily === family.name
			) {
				return {
					...family,
					shouldBeRemoved: true,
				};
			}
			return family;
		} );
		setNewThemeFonts( updatedFonts );
	}

	function deleteFontFace() {
		const { fontFamily, weight, style } = fontToDelete;
		const updatedFonts = newThemeFonts.reduce( ( acc, family ) => {
			const { fontFace = [], ...updatedFamily } = family;
			if (
				fontFamily === family.fontFamily &&
				fontFace.filter( ( face ) => ! face.shouldBeRemoved ).length ===
					1
			) {
				updatedFamily.shouldBeRemoved = true;
			}
			updatedFamily.fontFace = fontFace.map( ( face ) => {
				if (
					weight === face.fontWeight &&
					style === face.fontStyle &&
					( fontFamily === family.fontFamily ||
						fontFamily === family.name )
				) {
					return {
						...face,
						shouldBeRemoved: true,
					};
				}
				return face;
			} );
			return [ ...acc, updatedFamily ];
		}, [] );
		setNewThemeFonts( updatedFonts );
	}

	// format the theme fonts object to be used by the FontsSidebar component
	const fontsOutline = newThemeFonts.reduce( ( acc, fontFamily ) => {
		acc[ fontFamily.fontFamily ] = {
			family: fontFamily.name || fontFamily.fontFamily,
			faces: ( fontFamily.fontFace || [] ).map( ( face ) => {
				return {
					weight: face.fontWeight,
					style: face.fontStyle,
					src: localFileAsThemeAssetUrl( face.src[ 0 ] ),
				};
			} ),
		};
		return acc;
	}, {} );

	return (
		<>
			<HelpModal isOpen={ isHelpOpen } onClose={ toggleIsHelpOpen } />

			<FontsPageLayout>
				<main>
					<PageHeader toggleIsHelpOpen={ toggleIsHelpOpen } />

					<ConfirmDeleteModal
						isOpen={ showConfirmDialog }
						onConfirm={ confirmDelete }
						onCancel={ cancelDelete }
						fontToDelete={ fontToDelete }
					/>

					<DemoTextInput />

					{ newThemeFonts.length === 0 ? (
						<p>
							{ __(
								'There are no font families defined in your theme.json file.',
								'create-block-theme'
							) }
						</p>
					) : (
						<div className="font-families">
							{ newThemeFonts.map( ( fontFamily, i ) => (
								<FontFamily
									fontFamily={ fontFamily }
									key={ `fontfamily${ i }` }
									deleteFont={ requestDeleteConfirmation }
								/>
							) ) }
						</div>
					) }

					<form method="POST" id="manage-fonts-form">
						<input
							type="hidden"
							name="new-theme-fonts-json"
							value={ JSON.stringify( newThemeFonts ) }
						/>
						<input type="hidden" name="nonce" value={ nonce } />
					</form>
				</main>

				<FontsSidebar
					title={ __( 'Theme Fonts', 'create-block-theme' ) }
					fontsOutline={ fontsOutline }
					handleDeleteFontFace={ requestDeleteConfirmation }
					handleDeleteFontFamily={ requestDeleteConfirmation }
				/>
			</FontsPageLayout>
		</>
	);
}

// export default ManageFonts;

export default function () {
	return (
		<div
			style={ {
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			} }
		>
			<div
				style={ {
					width: '600px',
					marginTop: '2rem',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					textAlign: 'center',
				} }
			>
				<h1 style={ { width: '400px', lineHeight: 1.4 } }>
					{ __(
						'The new Font Library is now available in the WordPress editor.',
						'create-block-theme'
					) }
				</h1>
				<p>
					{ __(
						'You can manage your theme fonts directly from the',
						'create-block-theme'
					) }{ ' ' }
					<a href="/wp-admin/site-editor.php?canvas=edit">
						{ _x(
							'editor',
							'Link to the site editor',
							'create-block-theme'
						) }
					</a>
					.
				</p>
				<img
					src="https://i0.wp.com/wordpress.org/news/files/2024/04/Font-Manager-2.png?w=620&ssl=1"
					alt="WordPress 6.5 Font Library"
				/>
				<p>
					{ __(
						'For more information, please check out',
						'create-block-theme'
					) }{ ' ' }
					<a href="https://wordpress.org/news/2024/04/regina/">{ `What's inside 6.5` }</a>
					.
				</p>
			</div>
		</div>
	);
}
