# User Expressions Extension for SillyTavern

This extension adds dynamic expression sprites for the user, similar to the built-in Character Expressions feature. It allows the user's avatar to show different expressions based on their messages.

## Features

- Automatic expression detection based on message content
- Support for multiple images per expression type
- Configurable repository for expression images
- Floating preview of current expression
- Custom expression mapping and fallbacks

## Installation

1. Place the extension folder in: `SillyTavern/public/scripts/extensions/third-party/st-user-expressions/`
2. Restart SillyTavern
3. Go to Extensions → User Expressions to configure

## File Structure

Place your expression images in:
```
SillyTavern/public/UserExpressions/
├── neutral_0.png
├── happy_0.png
├── happy_1.png
├── angry_0.png
└── ...
```

Or specify a custom path in the extension settings.

## Configuration

1. **Base Path**: Set the directory containing your expression images
2. **Expressions**: Configure which expressions are available and their image counts
3. **Classification**: Adjust how messages are mapped to expressions

## Usage

1. Add your expression images to the specified directory
2. Configure the expression settings in the extension panel
3. Send messages - your avatar will automatically update based on content

## Repository Support

You can also use images from a remote repository by setting the repository URL in the extension settings. The extension will look for images in the format:
`{repository_url}/{expression}_{number}.png`

## Support

For issues or feature requests, please open an issue on the GitHub repository.

## License

This project is open source and available under the MIT License.
