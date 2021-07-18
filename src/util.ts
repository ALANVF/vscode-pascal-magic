interface Array<T> {
	at(index: number): T;
	setAt(index: number, value: T): void;
}

Array.prototype.at = function<T>(this: T[], index: number) {
	if(index < 0) {
		index += this.length;
	}

	return this[index];
};

Array.prototype.setAt = function<T>(this: T[], index: number, value: T) {
	if(index < 0) {
		index += this.length;
	}

	this[index] = value;
};